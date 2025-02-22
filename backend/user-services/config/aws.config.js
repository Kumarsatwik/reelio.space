import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const isOffline = process.env.IS_OFFLINE === "true";
const isDevelopment = process.env.NODE_ENV === "development";

const getAWSConfig = () => {
  // Base configuration
  const baseConfig = {
    region: process.env.AWS_REGION || "us-east-1",
  };

  // For local development or offline mode
  if (isOffline || isDevelopment) {
    console.log("Using local DynamoDB configuration");
    return {
      ...baseConfig,
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials: {
        accessKeyId: "local",
        secretAccessKey: "local",
      },
      sslEnabled: false,
      forcePathStyle: true, // Needed for local DynamoDB
    };
  }

  // For production with real AWS credentials
  console.log("Using production AWS configuration");
  return {
    ...baseConfig,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  };
};

const config = getAWSConfig();
const ddbClient = new DynamoDBClient(config);

const marshallOptions = {
  convertEmptyValues: true,
  removeUndefinedValues: true,
  convertClassInstanceToMap: true,
};

const unmarshallOptions = {
  wrapNumbers: false,
};

const translateConfig = { marshallOptions, unmarshallOptions };

// Debug configuration
if (isDevelopment) {
  console.log("DynamoDB Configuration:", {
    isOffline,
    endpoint: config.endpoint,
    region: config.region,
    usingLocalCredentials: isOffline || isDevelopment,
  });
}

export const docClient = DynamoDBDocumentClient.from(
  ddbClient,
  translateConfig
);
export const dynamoDB = ddbClient;
