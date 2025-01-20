import { uploadChunkToS3 } from "../config/aws.js";

export const uploadVideo = async (req, res) => {
  const { chunkIndex, title, fileId, totalChunks } = req.body;
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

    res.status(200).json({ message: "Chunk uploaded successfully", result });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    res.status(500).json({ error: error.message });
  }
};
