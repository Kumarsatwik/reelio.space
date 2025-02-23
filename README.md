# Reelio.space

A scalable video transcoding service built with AWS services that efficiently processes and converts videos into multiple resolutions using HLS (HTTP Live Streaming) format.

## Architecture Overview
![Uploading image.png…]()



## Flow Description

1. **Video Upload**
   - Users upload video chunks to the temporary S3 bucket
   - Lambda function merges chunks into a single video file
   - Merged file is stored in the temp-video bucket

2. **Queue Management**
   - S3 triggers an event to SQS with video processing details
   - SQS worker (Node.js) monitors the queue and Redis state
   - Redis ensures maximum of 3 concurrent ECS tasks

3. **Video Processing**
   - ECS Fargate task starts for video transcoding
   - FFmpeg converts video into multiple HLS resolutions
   - Transcoded files are uploaded to production bucket
   - Task completion updates Redis counter

4. **Process Completion**
   - SQS worker removes processed message from queue
   - System continues processing next available message

## Features

- Chunk-based video upload for large files
- Automatic video transcoding to multiple resolutions
- HLS streaming format support
- Scalable architecture with AWS services
- Concurrent processing management
- Queue-based task distribution

## Prerequisites

- Node.js 18 or higher
- AWS Account with appropriate permissions
- Docker for local development
- FFmpeg installed locally for development

## Project Structure

```
├── backend/
│   ├── transcoder-container/    # FFmpeg transcoding container
│   ├── user-services/           # User management API
│   └── video-consumer/          # SQS consumer service
└── client/                      # Frontend application
```

## Setup Instructions

1. **Environment Configuration**

   Copy `.env.example` files and configure:

   ```bash
   # Backend services
   cp backend/user-services/.env.example backend/user-services/.env
   cp backend/transcoder-container/.env.example backend/transcoder-container/.env
   ```

2. **AWS Configuration**

   Configure AWS credentials and resources:
   - Create S3 buckets for temporary and production videos
   - Set up SQS queue
   - Configure ECS cluster and task definitions
   - Set up necessary IAM roles and permissions

3. **Local Development**

   ```bash
   # Install dependencies
   cd backend/user-services && npm install
   cd ../transcoder-container && npm install
   cd ../video-consumer && npm install
   cd ../../client && npm install
   ```

## Deployment

1. **Backend Services**

   ```bash
   # Deploy user services
   cd backend/user-services
   npm run deploy

   # Deploy video consumer
   cd ../video-consumer
   serverless deploy
   ```

2. **Transcoder Container**

   ```bash
   # Build and push Docker image
   cd backend/transcoder-container
   docker build -t video-transcoder .
   docker tag video-transcoder:latest your-registry/video-transcoder:latest
   docker push your-registry/video-transcoder:latest
   ```

## Environment Variables

### User Services
- `AWS_ACCESS_KEY`: AWS access key
- `AWS_SECRET_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `AWS_BUCKET_NAME`: S3 bucket for temporary storage

### Transcoder Container
- `AWS_ACCESS_KEY`: AWS access key
- `AWS_SECRET_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `AWS_PROD_BUCKET_NAME`: Production S3 bucket
- `AWS_TEMP_BUCKET_NAME`: Temporary S3 bucket

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
