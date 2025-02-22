import {
  ECSClient,
  RunTaskCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import { SQSClient, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const MAX_CONTAINER_COUNT = 3;
const RETRY_DELAY_SECONDS = 30;

const isOffline = process.env.IS_OFFLINE;

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION,
  ...(isOffline && { endpoint: "http://localhost:3002" }),
});

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  ...(isOffline && {
    endpoint: "http://localhost:9324",
    credentials: {
      accessKeyId: "root",
      secretAccessKey: "root",
    },
  }),
});

async function getRunningTaskCount() {
  console.log("start count");
  try {
    const listTasksCommand = new ListTasksCommand({
      cluster: process.env.CLUSTER,
      desiredStatus: "RUNNING",
    });

    const { taskArns } = await ecsClient.send(listTasksCommand);
    if (!taskArns || taskArns.length === 0) return 0;

    const describeTasksCommand = new DescribeTasksCommand({
      cluster: process.env.CLUSTER,
      tasks: taskArns,
    });

    const { tasks } = await ecsClient.send(describeTasksCommand);
    return tasks.filter((task) => task.lastStatus === "RUNNING").length;
  } catch (error) {
    console.error("Error getting running task count:", error);
    throw error;
  }
}

async function deleteMessage(receiptHandle) {
  const deleteCommand = new DeleteMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });
  await sqsClient.send(deleteCommand);
}

async function startTranscodingTask(bucket, key) {
  const runTaskCommand = new RunTaskCommand({
    taskDefinition: process.env.TASK_DEFINITION,
    cluster: process.env.CLUSTER,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: process.env.SUBNETS.split(","),
        securityGroups: [process.env.SECURITY_GROUPS],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "video-transcoder",
          environment: [
            { name: "BUCKET_NAME", value: bucket },
            { name: "KEY", value: key },
          ],
        },
      ],
    },
  });

  await ecsClient.send(runTaskCommand);
}

export const handler = async (event) => {
  console.log("init");
  try {
    // Get current running task count from Redis
    const runningTasks = await getRunningTaskCount();

    if (runningTasks >= MAX_CONTAINER_COUNT) {
      throw new Error("MAX_CAPACITY_REACHED");
    }

    console.log("process record from sqs");

    // Process each record from SQS
    for (const record of event.Records) {
      const body = JSON.parse(record.body);

      // Skip test events
      if (body?.Service === "Amazon S3" && body?.Event === "s3:TestEvent") {
        await deleteMessage(record.receiptHandle);
        continue;
      }

      // Process S3 events
      if (body.Records && Array.isArray(body.Records)) {
        for (const s3Record of body.Records) {
          const {
            s3: {
              bucket: { name: bucketName },
              object: { key },
            },
          } = s3Record;

          console.log("start transcoding");
          await startTranscodingTask(bucketName, key);
        }
      }
      console.log("delete message");
      // Delete processed message
      await deleteMessage(record.receiptHandle);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Tasks started successfully" }),
    };
  } catch (error) {
    if (error.message === "MAX_CAPACITY_REACHED") {
      console.log("Maximum capacity reached, delaying message reprocessing");

      // Delay message processing by making SQS retry after 30 seconds
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_SECONDS * 1000)
      );

      return {
        statusCode: 429,
        body: JSON.stringify({
          message: "Max capacity reached, retrying later",
        }),
      };
    }

    console.error("Error processing messages:", error);
    throw error;
  }
};
