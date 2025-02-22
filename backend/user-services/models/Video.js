import { v4 as uuidv4 } from "uuid";
import { BaseModel } from "./BaseModel.js";
import { User } from "./User.js";

/**
 * @typedef {Object} VideoData
 * @property {string} userId
 * @property {string} title
 * @property {string} description
 * @property {string} url - The URL of the video
 * @property {string} [status='processing']
 */

/**
 * Represents a video in the system
 * @extends BaseModel
 */
export class Video extends BaseModel {
  static TABLE_NAME = "Videos";
  static VALID_STATUSES = ["processing", "ready", "failed"];

  constructor() {
    super(Video.TABLE_NAME);
  }

  /**
   * Initialize Video table in DynamoDB
   */
  async createTable() {
    const params = {
      KeySchema: [{ AttributeName: "videoId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "videoId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "UserIdIndex",
          KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };
    await super.createTable(params);
  }

  /**
   * Create a new video
   * @param {VideoData} videoData
   * @throws {Error} If validation fails
   */
  async create(videoData) {
    this.#validateVideoData(videoData);

    const video = {
      videoId: videoData.videoId,
      userId: videoData.userId,
      title: videoData.title,
      description: videoData.description,
      status: videoData.status || "processing",
      url: videoData.url,
      thumbnail: videoData.thumbnail || "",
      likes: [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await super.put(video);
    return video;
  }

  async getVideos() {
    return await super.getAll();
  }

  async getVideosWithUserDetails() {
    const videos = await super.getAll();
    const userModel = new User();

    // Get unique user IDs from videos
    const userIds = [...new Set(videos.map((video) => video.userId))];

    // Fetch user details for all users in parallel
    const userDetails = await Promise.all(
      userIds.map(async (userId) => {
        const user = await userModel.findUserById(userId);
        
        if (!user) {
          return {
            userId,
            name: "Unknown User",
            channelName: "Unknown Channel",
          };
        }
        return {
          userId,
          name: user.name,
          channelName: user.channelName || user.name,
        };
      })
    );

    // Create a map of user details for quick lookup
    const userMap = Object.fromEntries(
      userDetails.map((user) => [user.userId, user])
    );

    // Combine video data with user details
    return videos.map((video) => ({
      ...video,
      user: userMap[video.userId] || {
        name: "Unknown User",
        channelName: "Unknown Channel",
      },
    }));
  }

  /**
   * Toggle like on a video
   * @param {string} videoId
   * @param {string} userId
   */
  async toggleLike(videoId, userId) {
    const video = await this.findById(videoId);
    if (!video) throw new Error("Video not found");

    const likes = video.likes || [];
    const userLikeIndex = likes.indexOf(userId);

    if (userLikeIndex === -1) {
      likes.push(userId);
    } else {
      likes.splice(userLikeIndex, 1);
    }

    return await super.update(
      { videoId },
      "SET likes = :likes, updatedAt = :updatedAt",
      {
        ":likes": likes,
        ":updatedAt": new Date().toISOString(),
      }
    );
  }

  /**
   * Increment video views
   * @param {string} videoId
   */
  async incrementViews(videoId) {
    return await super.update(
      { videoId },
      "SET views = if_not_exists(views, :zero) + :inc, updatedAt = :updatedAt",
      {
        ":inc": 1,
        ":zero": 0,
        ":updatedAt": new Date().toISOString(),
      }
    );
  }

  /**
   * Find video by ID
   * @param {string} videoId
   */
  async findById(videoId) {
    return await super.get({ videoId });
  }

  /**
   * Find videos by user ID
   * @param {string} userId
   */
  async findByUserId(userId) {
    try {
      const result = await super.query({
        IndexName: "UserIdIndex",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Get newest first
        ConsistentRead: false, // GSI doesn't support consistent reads
      });

      // console.log("Query result:", result);
      return result;
    } catch (error) {
      console.error("Error in findByUserId:", error);
      throw error;
    }
  }

  /**
   * Update video status
   * @param {string} videoId
   * @param {string} status
   */
  async updateStatus(videoId, status) {
    if (!Video.VALID_STATUSES.includes(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${Video.VALID_STATUSES.join(", ")}`
      );
    }

    return await super.update(
      { videoId },
      "SET #status = :status, updatedAt = :updatedAt",
      {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      }
    );
  }

  /**
   * Validate video data
   * @private
   * @param {VideoData} data
   * @throws {Error} If validation fails
   */
  #validateVideoData(data) {
    if (!data.userId) throw new Error("userId is required");
    if (!data.title) throw new Error("title is required");
    if (!data.description) throw new Error("description is required");
    if (!data.url) throw new Error("url is required");
    if (!data.thumbnail) throw new Error("thumbnail is required");
    if (data.status && !Video.VALID_STATUSES.includes(data.status)) {
      throw new Error(
        `Invalid status. Must be one of: ${Video.VALID_STATUSES.join(", ")}`
      );
    }
  }
}
