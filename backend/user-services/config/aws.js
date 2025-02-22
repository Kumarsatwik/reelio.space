import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "dotenv/config";

const awsConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.AWS_REGION,
};

// Initialize DynamoDB
const ddbClient = new DynamoDBClient(awsConfig);
export const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

// Initialize S3
const s3 = new S3Client(awsConfig);

// Generate Presigned URL
export const generatePresignedUrl = async (fileName, fileType) => {
  console.log("generatePre", fileName, fileType);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
  };

  console.log("Presigned URL Params:", params);

  try {
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return url;
  } catch (error) {
    console.error("Presigned URL Generation Error:", error);
    throw new Error(`Presigned URL Error: ${error.message}`);
  }
};

// Upload Chunk to S3
export const uploadChunkToS3 = async (key, chunk, contentType) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: chunk,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`S3 Upload Error: ${error.message}`);
  }
};

export default s3;
