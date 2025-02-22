import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamoDB, docClient } from "../config/aws.config.js";

export class BaseModel {
  constructor(tableName, sensitiveFields = ['password']) {
    this.tableName = tableName;
    this.sensitiveFields = sensitiveFields;
  }

  _removeSensitiveFields(item) {
    if (!item) return item;
    const sanitizedItem = { ...item };
    this.sensitiveFields.forEach(field => delete sanitizedItem[field]);
    return sanitizedItem;
  }


  async deleteTableIfExists() {
    try {
      await dynamoDB.send(
        new DescribeTableCommand({ TableName: this.tableName })
      );
      await dynamoDB.send(
        new DeleteTableCommand({ TableName: this.tableName })
      );
      console.log(`Deleted existing table: ${this.tableName}`);
      // Wait for table deletion
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      if (!(error instanceof ResourceNotFoundException)) {
        console.error(
          `Error checking/deleting table ${this.tableName}:`,
          error
        );
      }
    }
  }

  async createTable(params) {
    try {
      // Delete existing table if in development
      if (process.env.NODE_ENV === "development") {
        await this.deleteTableIfExists();
      }

      const command = new CreateTableCommand({
        ...params,
        TableName: this.tableName,
      });
      await dynamoDB.send(command);

      // Wait for table creation
      console.log(`Waiting for table ${this.tableName} to become active...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log(`Created table ${this.tableName}`);
    } catch (error) {
      if (error.name === "ResourceInUseException") {
        console.log(`Table ${this.tableName} already exists`);
      } else {
        console.error(`Error creating table ${this.tableName}:`, error);
        throw error;
      }
    }
  }

  async get(key) {
    try {
      console.log("Getting item with key:", key,this.tableName);
      const command = new GetCommand({
        TableName: this.tableName,
        Key: key,
      });
      const result = await docClient.send(command);
      return this._removeSensitiveFields(result.Item);
    } catch (error) {
      console.error("Error in get operation:", error);
      throw error;
    }
  }

  async getAll() {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': "completed"
        }
      });
      const result = await docClient.send(command);
      return result.Items.map(item => this._removeSensitiveFields(item));
    } catch (error) {
      console.error("Error in getAll operation:", error);
      throw error;
    }
  }

  async put(item) {
    try {
      console.log("Putting item:", item);
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
      });
      await docClient.send(command);
      return item;
    } catch (error) {
      console.error("Error in put operation:", error);
      throw error;
    }
  }

  async update(
    key,
    updateExpression,
    expressionAttributeValues,
    expressionAttributeNames
  ) {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    });
    const result = await docClient.send(command);
    return result.Attributes;
  }

  async delete(key) {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: key,
    });
    await docClient.send(command);
  }

  async query(params) {
    const command = new QueryCommand({
      ...params,
      TableName: this.tableName,
    });
    const result = await docClient.send(command);
    return (result.Items || []).map(item => this._removeSensitiveFields(item));
  }
}
