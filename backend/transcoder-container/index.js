import "@aws-sdk/crc64-nvme-crt";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

const RESOLUTIONS = [
  { name: "360p", width: 480, height: 360, bitrate: "800k" },
  { name: "480p", width: 858, height: 480, bitrate: "1200k" },
  { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
];

const s3 = new S3Client({
  credentials: {
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: "us-east-1",
  disableFlexibleChecksums: true,
  maxAttempts: 5, // Increase the number of retries
  retryMode: "adaptive", // Use adaptive retry mode
});

const dynamoDb = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoDb);

const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

// Function to upload a file to S3
async function uploadFileToS3(filePath, bucket, key) {
  console.log("uploadFileToS3", filePath);
  const fileStream = createReadStream(filePath);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
    },
  });

  await upload.done();
  console.log("Uploaded:", key);
}

async function updateVideoRecord(videoId, videoUrl) {
  const command = new UpdateCommand({
    TableName: "Videos",
    Key: {
      videoId: videoId,
    },
    UpdateExpression: "set #videoUrl = :p, #videoStatus = :s",
    ExpressionAttributeNames: {
      "#videoUrl": "url",
      "#videoStatus": "status",
    },
    ExpressionAttributeValues: {
      ":p": videoUrl,
      ":s": "completed",
    },
    ReturnValues: "ALL_NEW",
  });

  try {
    const response = await docClient.send(command);
    console.log("Updated DynamoDB record:", response);
  } catch (error) {
    console.error("Error updating DynamoDB:", error);
    throw error;
  }
}

async function init() {
  try {
    console.log("init app");
    console.log("KEY", KEY);
    console.log("bucketName", BUCKET_NAME);

    // Download the original video from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: KEY,
    });
    const response = await s3.send(command);

    // Save the original video locally
    const originalFilePath = `original-video.mp4`;
    await fs.writeFile(
      originalFilePath,
      await response.Body.transformToByteArray()
    );

    const originalVideoPath = path.resolve(originalFilePath);

    // Create HLS for each resolution
    const promises = RESOLUTIONS.map(async (resolution) => {
      const outputDir = path.join("videos", KEY, resolution.name);
      await fs.mkdir(outputDir, { recursive: true });

      const outputPattern = path.join(outputDir, `chunk-%03d.ts`); // Output chunk pattern
      const playlistFile = path.join(outputDir, `index.m3u8`);

      return new Promise((resolve) => {
        ffmpeg(originalVideoPath)
          .output(playlistFile) // Output the playlist file
          .withVideoCodec("libx264")
          .withAudioCodec("aac")
          .withSize(`${resolution.width}x${resolution.height}`)
          .withVideoBitrate(resolution.bitrate)
          .outputOptions([
            "-hls_time 8", // 8-second segments
            "-hls_playlist_type vod", // VOD playlist type
            `-hls_segment_filename ${outputPattern}`, // Segment naming
          ])
          .on("start", () => {
            console.log("start", `${resolution.width}x${resolution.height}`);
          })
          .on("end", async () => {
            try {
              // Upload chunks and playlist to S3
              const files = await fs.readdir(outputDir);
              for (const file of files) {
                const filePath = path.join(outputDir, file);
                const s3Key = `${KEY}/${resolution.name}/${file}`;
                await uploadFileToS3(
                  filePath,
                  process.env.AWS_PROD_BUCKET_NAME,
                  s3Key
                );
              }

              console.log(
                "HLS generation and uploading completed for:",
                resolution.name
              );

              resolve({ resolution, playlist: playlistFile });
            } catch (error) {
              console.error("Error uploading chunks:", error);
              resolve(null); // Resolve with null in case of error
            }
          })
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            resolve(null); // Resolve with null in case of error
          })
          .run();
      });
    });

    // Wait for all tasks to complete
    const results = await Promise.all(promises);

    // Filter out null values (failed resolutions)
    const validResults = results.filter((result) => result !== null);

    if (validResults.length === 0) {
      throw new Error("All resolutions failed to process.");
    }
    console.log("validResults", validResults);

    // Generate master playlist
    const masterPlaylist = validResults
      .map(
        ({ resolution }) =>
          `#EXT-X-STREAM-INF:BANDWIDTH=${resolution.bitrate},RESOLUTION=${resolution.width}x${resolution.height}\n${resolution.name}/index.m3u8`
      )
      .join("\n");

    const masterPlaylistPath = path.join("videos", KEY, "master.m3u8");
    await fs.mkdir(path.dirname(masterPlaylistPath), { recursive: true });
    await fs.writeFile(masterPlaylistPath, `#EXTM3U\n${masterPlaylist}`);

    // Upload the master playlist
    await uploadFileToS3(
      masterPlaylistPath,
      "prod-videos.reelio.space",
      `${KEY}/master.m3u8`
    );

    console.log("Master playlist uploaded successfully.");

    // Construct the correct S3 URL for the m3u8 file
    const m3u8Path = `https://s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${
      process.env.OUTPUT_BUCKET || "prod-videos.reelio.space"
    }/${KEY}/master.m3u8`;

    // Extract videoId from the KEY
    const keyParts = KEY.split("___");
    const videoId = keyParts[0].replace("videos/", "");

    await updateVideoRecord(videoId, m3u8Path);

    console.log("Transcoding complete and DynamoDB updated");

    // Delete the original video from the temporary bucket
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: KEY,
      });
      await s3.send(deleteCommand);
      console.log("Deleted original video from temporary bucket:", KEY);
    } catch (error) {
      console.error("Error deleting original video:", error);
    }
  } catch (error) {
    console.error("Error in transcoding process:", error);
    throw error;
  }
}
init()
  .catch((err) => {
    console.log("err", err);
  })
  .finally(() => {
    console.log("finally");
    process.exit(0);
  });
