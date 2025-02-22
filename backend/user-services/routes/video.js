import express from "express";
import auth from "../middleware/auth.js";
import {
  getUserVideos,
  getVideoById,
  updateVideoStatus,
  deleteVideo,
  getVideos,
} from "../controllers/videoController.js";

const router = express.Router();

// Protect all routes with authentication

// Video routes
router.get("/", getVideos);
router.use(auth);
router.get("/user/:userId", getUserVideos);
router.get("/:videoId", getVideoById);
router.patch("/:videoId/status", updateVideoStatus);
router.delete("/:videoId", deleteVideo);

export default router;
