import upload from "../middleware/uploadMiddleware.js";
import { uploadVideo } from "../controllers/videoController.js";
import express from "express";
const router = express.Router();

router.post("/chunk", upload.single("chunk"), uploadVideo);

export default router;
