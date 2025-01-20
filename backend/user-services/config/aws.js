import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import AWS from "aws-sdk";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import "dotenv/config";
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_KEY,
//   region: process.env.AWS_REGION,
// });

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.AWS_REGION,
});

// Generate Presigned URL
export const generatePresignedUrl = async (fileName, fileType) => {
  console.log("generatePre", fileName, fileType);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
    Expires: 60 * 5, // URL expires in 5 minutes
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

// export const triggerLambdaFunction = async (fileId) => {
//   const lambda = new AWS.Lambda();
//   const params = {
//     FunctionName: "upload-trigger",
//     Payload: JSON.stringify({ fileId }),
//   };
//   console.log("fileId", fileId);

//   await lambda.invoke(params).promise();
// };

export default s3;
