import bcrypt from "bcryptjs";
import { BaseModel } from "./BaseModel.js";
import { v4 as uuidv4 } from "uuid";

export class User extends BaseModel {
  static TABLE_NAME = "Users";

  constructor() {
    super(User.TABLE_NAME);
  }

  /**
   * Initialize User table in DynamoDB
   */
  async createTable() {
    const params = {
      TableName: this.tableName,
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "email", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "UserIdIndex",
          KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
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
   * Find a user by email
   */
  async findByEmail(email) {
    return await super.get({ email });
  }

  async findUserById(userId) {
    console.log('userId',userId)
    try {
      const result = await super.query({
        TableName: this.tableName, // Explicitly specify table name
        IndexName: "UserIdIndex", // Ensure this matches DynamoDB index name
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      });

      console.log("UserId result:", result);

      return result.length > 0 ? result[0] : null; // Properly return user
    } catch (error) {
      console.error("Error in findUserById:", error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  async create(userData) {
    const { email, password, name } = userData;

    if (!email || !password || !name) {
      throw new Error("Missing required fields");
    }

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await this.#hashPassword(password);

    const user = {
      userId: uuidv4(),
      email,
      password: hashedPassword,
      name,
      subscriptions: [],
      watchLater: [],
      createdAt: new Date().toISOString(),
      channelName: "reelio " + name,
    };

    await super.put(user);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Toggle subscription to a creator
   */
  async toggleSubscription(subscriberEmail, creatorEmail) {
    const user = await this.findByEmail(subscriberEmail);
    if (!user) throw new Error("User not found");

    const subscriptions = user.subscriptions || [];
    const subscriptionIndex = subscriptions.indexOf(creatorEmail);

    if (subscriptionIndex === -1) {
      subscriptions.push(creatorEmail);
    } else {
      subscriptions.splice(subscriptionIndex, 1);
    }

    await super.update(
      { email: subscriberEmail },
      "SET subscriptions = :subscriptions",
      { ":subscriptions": subscriptions }
    );

    return { subscriberEmail, subscriptions };
  }

  /**
   * Toggle video in watch later list
   */
  async toggleWatchLater(email, videoId) {
    const user = await this.findByEmail(email);
    if (!user) throw new Error("User not found");

    const watchLater = user.watchLater || [];
    const videoIndex = watchLater.indexOf(videoId);

    if (videoIndex === -1) {
      watchLater.push(videoId);
    } else {
      watchLater.splice(videoIndex, 1);
    }

    await super.update({ email }, "SET watchLater = :watchLater", {
      ":watchLater": watchLater,
    });

    return { email, watchLater };
  }

  /**
   * Validate user password
   */
  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash a password
   */
  async #hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async updateProfile(email, data) {
    const updateFields = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (data.name) {
      updateFields.push("#nm = :name");
      expressionAttributeValues[":name"] = data.name;
      expressionAttributeNames["#nm"] = "name";
    }

    if (data.channelName) {
      updateFields.push("#cn = :channelName");
      expressionAttributeValues[":channelName"] = data.channelName;
      expressionAttributeNames["#cn"] = "channelName";
    }

    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    return await super.update(
      { email },
      "SET " + updateFields.join(", "),
      expressionAttributeValues,
      expressionAttributeNames
    );
  }
}

export default User;
