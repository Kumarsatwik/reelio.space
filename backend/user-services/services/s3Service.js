import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
  }

  async initiateMultipartUpload(fileName, contentType) {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        ContentType: contentType,
      });

      const response = await this.s3Client.send(command);
      return response.UploadId;
    } catch (error) {
      console.error("Error initiating multipart upload:", error);
      throw error;
    }
  }

  async uploadPart(uploadId, fileName, partNumber, chunk) {
    try {
      const command = new UploadPartCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: chunk,
      });

      const response = await this.s3Client.send(command);
      return {
        PartNumber: partNumber,
        ETag: response.ETag,
      };
    } catch (error) {
      console.error(`Error uploading part ${partNumber}:`, error);
      throw error;
    }
  }

  async completeMultipartUpload(uploadId, fileName, parts) {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      });

      return await this.s3Client.send(command);
    } catch (error) {
      console.error("Error completing multipart upload:", error);
      throw error;
    }
  }

  async abortMultipartUpload(uploadId, fileName) {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error("Error aborting multipart upload:", error);
      throw error;
    }
  }

  async renameObject(oldKey, newKey) {
    try {
      // URL encode the source key for the copy operation
      const encodedOldKey = encodeURIComponent(oldKey);
      
      // Copy the object to the new key
      await this.s3Client.send(new CopyObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        CopySource: `${process.env.AWS_BUCKET_NAME}/${encodedOldKey}`,
        Key: newKey,
        MetadataDirective: 'COPY',
        ACL: 'private'  // Ensure proper permissions
      }));

      // Delete the old object after successful copy
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: oldKey
      }));

      return newKey;
    } catch (error) {
      console.error('Error renaming S3 object:', error);
      throw error;
    }
  }

  async uploadFile(key, buffer, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_PROD_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      return `https://${process.env.AWS_PROD_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }
}

export default new S3Service();
