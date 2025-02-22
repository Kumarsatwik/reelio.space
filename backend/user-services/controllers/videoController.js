import { uploadChunkToS3 } from "../config/aws.js";
import { Video } from "../models/Video.js";

const videoModel = new Video();

export const uploadVideo = async (req, res) => {
  const { chunkIndex, title, fileId, totalChunks, description } = req.body;
  const isFinalChunk = parseInt(chunkIndex) === parseInt(totalChunks) - 1;

  // Generate the fileKey with .final suffix for the last chunk
  const fileKey = `uploads/${fileId}/${title.replace(
    / /g,
    "-"
  )}.chunk${chunkIndex}${isFinalChunk ? ".final" : ""}`;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Upload the chunk to S3
    const result = await uploadChunkToS3(
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

    // If this is the first chunk, create a video entry in DynamoDB
    if (chunkIndex === "0") {
      const videoUrl = `videos/${fileId}/${title.replace(/ /g, "-")}.mp4`;
      await Video.create({
        userId: req.user.email, // Using email as userId since it's unique
        title,
        description: description || "",
        status: "uploading",
        url: videoUrl,
      });
    }

    // If this is the final chunk, update the video status
    if (isFinalChunk) {
      await Video.updateStatus(fileId, "processing");
    }

    res.status(200).json({
      message: "Chunk uploaded successfully",
      result,
      isFinalChunk,
    });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getVideos = async (req, res) => {
  try {
    const videos = await videoModel.getVideosWithUserDetails();
    // console.log("videos", videos);
    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const getUserVideos = async (req, res) => {
  try {
    // Use findByUserId instead of findById
    const videos = await videoModel.findByUserId(req.user.userId);

    res.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const getVideoById = async (req, res) => {
  try {
    
    const video = await videoModel.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    

    if (video.userId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

export const updateVideoStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { status } = req.body;

    const video = await videoModel.updateStatus(videoId, status);
    res.json(video);
  } catch (error) {
    console.error("Error updating video status:", error);
    res.status(500).json({ error: "Failed to update video status" });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await videoModel.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (video.userId !== req.user.email) {
      return res.status(403).json({ error: "Access denied" });
    }

    await videoModel.delete(req.params.videoId);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};
