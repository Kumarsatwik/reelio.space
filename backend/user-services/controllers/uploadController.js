import s3Service from "../services/s3Service.js";
import imageService from "../services/imageService.js";
import { Video } from "../models/Video.js";
import { v4 as uuidv4 } from "uuid";

const videoModel = new Video();

// Store upload states in memory (in production, use Redis or similar)
const uploadStates = new Map();

export const initiateUpload = async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        const s3Key = `videos/${fileName}`;
        const uploadId = await s3Service.initiateMultipartUpload(s3Key, fileType);
    
        uploadStates.set(uploadId, {
          parts: [],
          fileName: s3Key,
          startTime: Date.now(),
        });
    
        res.json({ uploadId });
      } catch (error) {
        console.error("Error initiating upload:", error);
        res.status(500).json({ error: "Failed to initiate upload" });
      }
};

export const uploadPart = async (req, res) => {
    try {
        const { uploadId } = req.params;
        const partNumber = parseInt(req.body.partNumber);
        const uploadState = uploadStates.get(uploadId);
    
        if (!uploadState) {
          return res.status(404).json({ error: "Upload not found" });
        }
    
        const part = await s3Service.uploadPart(
          uploadId,
          uploadState.fileName,
          partNumber,
          req.file.buffer
        );
    
        uploadState.parts.push(part);
        uploadStates.set(uploadId, uploadState);
    
        res.json({ part });
      } catch (error) {
        console.error("Error uploading part:", error);
        res.status(500).json({ error: "Failed to upload part" });
      }
};

export const completeUpload = async (req, res) => {
    try {
        const { uploadId } = req.params;
        const videoId = uuidv4();
        const { title, description, userId } = req.body;
        
        

        if (!title || !description || !userId || !req.file) {
            return res.status(400).json({ error: "Missing required fields or thumbnail" });
        }

        const uploadState = uploadStates.get(uploadId);
    
        if (!uploadState) {
            return res.status(404).json({ error: "Upload not found" });
        }
    
        // Complete video upload
        const { Location } = await s3Service.completeMultipartUpload(
            uploadId,
            uploadState.fileName,
            uploadState.parts
        );
    
        // Rename the video file
        const originalKey = uploadState.fileName;
        const newFileName = originalKey
            .split("/")[1]
            .split("___")[2]
            .split(" ")
            .join("_");
        const newKey = `videos/${videoId}___${userId}___${newFileName}`;
    
        await s3Service.renameObject(originalKey, newKey);

        // Process and upload thumbnail
        const processedThumbnail = await imageService.processImage(req.file.buffer);
        const thumbnailKey = `thumbnails/${videoId}___${userId}.jpg`;
        await s3Service.uploadFile(thumbnailKey, processedThumbnail, 'image/jpeg');
        const thumbnailUrl = `https://${process.env.AWS_PROD_BUCKET_NAME}.s3.amazonaws.com/${thumbnailKey}`;
    
        // Store video details in DynamoDB
        const videoData = {
            userId,
            title,
            description,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${newKey}`,
            status: "processing",
            videoId,
            thumbnail: thumbnailUrl
        };
    
        const video = await videoModel.create(videoData);
        uploadStates.delete(uploadId);
    
        res.json(video);
    } catch (error) {
        console.error("Error completing upload:", error);
        res.status(500).json({ error: "Failed to complete upload" });
    }
};

export const abortUpload = async (req, res) => {
    try {
      const { uploadId } = req.params;
      const uploadState = uploadStates.get(uploadId);
    
      if (!uploadState) {
        return res.status(404).json({ error: "Upload not found" });
      }
    
      await s3Service.abortMultipartUpload(uploadId, uploadState.fileName);
      uploadStates.delete(uploadId);
    
      res.json({ message: "Upload aborted successfully" });
    } catch (error) {
      console.error("Error aborting upload:", error);
      res.status(500).json({ error: "Failed to abort upload" });
    }
  };
