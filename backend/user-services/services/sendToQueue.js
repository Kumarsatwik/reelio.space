import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION });

export default async function sendToQueue(queueUrl,messageBody,messageGroupId){
    const params = {
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        MessageGroupId: messageGroupId
    };

    await sqs.send(new SendMessageCommand(params));
    console.log("Message sent to queue:", queueUrl);
}