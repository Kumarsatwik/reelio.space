const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  console.log("Lambda received request");
  console.log("Event:", JSON.stringify(event, null, 2));

  if (!event.Records || event.Records.length === 0) {
    console.error("No Records found in event");
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid event structure" }),
    };
  }

  const bucketName = event.Records[0].s3.bucket.name;
  const fileKey = event.Records[0].s3.object.key; // e.g., uploads/{fileId}/{title}.chunk3.final
  const fileId = fileKey.split("/")[1]; // Extract fileId from the key

  try {
    // List all chunks for the fileId
    const listParams = {
      Bucket: bucketName,
      Prefix: `uploads/${fileId}/`,
    };
    const chunks = await s3.listObjectsV2(listParams).promise();

    // Filter out the .final chunk and sort the remaining chunks
    const sortedChunks = chunks.Contents.filter(
      (chunk) => !chunk.Key.endsWith(".final")
    ).sort((a, b) => {
      const aIndex = parseInt(a.Key.split(".chunk")[1]);
      const bIndex = parseInt(b.Key.split(".chunk")[1]);
      return aIndex - bIndex;
    });

    // Temporary file path for merging
    const tempDir = "/tmp";
    const tempFilePath = path.join(tempDir, `merged-${fileId}.mp4`);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Merge chunks into the temporary file
    const writeStream = fs.createWriteStream(tempFilePath);
    for (const chunk of sortedChunks) {
      const chunkData = await s3
        .getObject({ Bucket: bucketName, Key: chunk.Key })
        .promise();
      writeStream.write(chunkData.Body);
    }

    // Close the write stream and wait for it to finish
    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    console.log("Chunks merged into temporary file:", tempFilePath);

    // Upload the merged file to S3
    const mergedFileKey = `uploads/${fileId}/merged-video.mp4`;
    const mergedFileStream = fs.createReadStream(tempFilePath);

    const uploadParams = {
      Bucket: bucketName,
      Key: mergedFileKey,
      Body: mergedFileStream,
    };
    await s3.upload(uploadParams).promise();

    console.log("Merged file uploaded to S3:", mergedFileKey);

    // Delete individual chunks (including the .final chunk)
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: chunks.Contents.map((chunk) => ({ Key: chunk.Key })),
      },
    };
    await s3.deleteObjects(deleteParams).promise();

    console.log("Chunks deleted from S3");

    // Delete the temporary file
    fs.unlinkSync(tempFilePath);
    console.log("Temporary file deleted:", tempFilePath);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Chunks merged successfully" }),
    };
  } catch (error) {
    console.error("Error merging chunks:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
