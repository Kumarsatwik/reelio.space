import { v4 as uuidv4 } from 'uuid';
import { BaseModel } from './BaseModel.js';

/**
 * @typedef {Object} CommentData
 * @property {string} videoId - ID of the video being commented on
 * @property {string} userId - ID of the user making the comment
 * @property {string} content - Content of the comment
 */

/**
 * Represents a comment on a video
 * @extends BaseModel
 */
export class Comment extends BaseModel {
    static TABLE_NAME = 'Comments';
    static MAX_CONTENT_LENGTH = 1000; // Maximum characters allowed in a comment

    constructor() {
        super(Comment.TABLE_NAME);
    }

    /**
     * Initialize Comment table in DynamoDB
     */
    async createTable() {
        const params = {
            KeySchema: [
                { AttributeName: 'commentId', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'commentId', AttributeType: 'S' },
                { AttributeName: 'videoId', AttributeType: 'S' }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'VideoIdIndex',
                    KeySchema: [
                        { AttributeName: 'videoId', KeyType: 'HASH' }
                    ],
                    Projection: {
                        ProjectionType: 'ALL'
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        };
        await super.createTable(params);
    }

    /**
     * Create a new comment
     * @param {CommentData} commentData 
     * @throws {Error} If validation fails
     */
    async create(commentData) {
        this.#validateCommentData(commentData);

        const comment = {
            commentId: uuidv4(),
            videoId: commentData.videoId,
            userId: commentData.userId,
            content: this.#sanitizeContent(commentData.content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await super.put(comment);
        return comment;
    }

    /**
     * Update a comment's content
     * @param {string} commentId 
     * @param {string} content 
     * @throws {Error} If content is invalid or comment not found
     */
    async update(commentId, content) {
        if (!content?.trim()) {
            throw new Error('Comment content is required');
        }

        if (content.length > Comment.MAX_CONTENT_LENGTH) {
            throw new Error(`Comment content cannot exceed ${Comment.MAX_CONTENT_LENGTH} characters`);
        }

        const comment = await this.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        return await super.update(
            { commentId },
            'SET content = :content, updatedAt = :updatedAt',
            {
                ':content': this.#sanitizeContent(content),
                ':updatedAt': new Date().toISOString()
            }
        );
    }

    /**
     * Delete a comment
     * @param {string} commentId 
     * @throws {Error} If comment not found
     */
    async delete(commentId) {
        const comment = await this.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        await super.delete({ commentId });
        return { commentId, deleted: true };
    }

    /**
     * Find a comment by ID
     * @param {string} commentId 
     */
    async findById(commentId) {
        return await super.get({ commentId });
    }

    /**
     * Find all comments for a video
     * @param {string} videoId 
     */
    async findByVideoId(videoId) {
        return await super.query({
            IndexName: 'VideoIdIndex',
            KeyConditionExpression: 'videoId = :videoId',
            ExpressionAttributeValues: {
                ':videoId': videoId
            }
        });
    }

    /**
     * Validate comment data
     * @private
     * @param {CommentData} data 
     * @throws {Error} If validation fails
     */
    #validateCommentData(data) {
        if (!data.videoId) throw new Error('videoId is required');
        if (!data.userId) throw new Error('userId is required');
        if (!data.content?.trim()) throw new Error('content is required');
        if (data.content.length > Comment.MAX_CONTENT_LENGTH) {
            throw new Error(`Comment content cannot exceed ${Comment.MAX_CONTENT_LENGTH} characters`);
        }
    }

    /**
     * Sanitize comment content
     * @private
     * @param {string} content 
     * @returns {string} Sanitized content
     */
    #sanitizeContent(content) {
        // Remove any HTML tags and normalize whitespace
        return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .trim()
            .replace(/\s+/g, ' '); // Normalize whitespace
    }
}
