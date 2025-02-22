import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit'
import User from "./models/User.js";
import { Video } from "./models/Video.js";
// import { Comment } from "./models/Comment.js";
import uploadRoutes from "./routes/upload.js";

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/video.js"; // Update this import

// Load environment variables
dotenv.config();


// Define rate limiter (Example: max 100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  headers: true, // Send rate limit info in headers
});

const app = express();

// Add cookie-parser before other middleware
app.use(cookieParser());
app.use(morgan("dev")); // First middleware to log all requests
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Initialize model instances
const userModel = new User();
const videoModel = new Video();
// const commentModel = new Comment();

// Initialize DynamoDB tables
const initializeTables = async () => {
  try {
    console.log("Starting table initialization...");

    // Force recreate tables in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Recreating tables...");
    }

    // Create tables sequentially with delay between each
    await userModel.createTable();
    console.log("Users table initialized");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await videoModel.createTable();
    console.log("Videos table initialized");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // await commentModel.createTable();
    // console.log("Comments table initialized");

    console.log("All DynamoDB tables initialized successfully");
  } catch (error) {
    console.error("Error initializing DynamoDB tables:", error);

    if (process.env.NODE_ENV === "development") {
      console.log(
        "Continuing in development mode despite table initialization error"
      );
    } else {
      process.exit(1);
    }
  }
};

app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes); // This now uses the consolidated routes
app.use("/api/upload", uploadRoutes);

// Initialize tables
initializeTables();

// Global error handling middleware must be last
app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    console.log("UnauthorizedError");
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);
  // In production, you might want to exit and let process manager restart
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Always exit on uncaught exceptions
  process.exit(1);
});

export default app;
