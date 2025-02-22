import express from "express";
import multer from "multer";
import { initiateUpload, uploadPart, completeUpload,abortUpload } from "../controllers/uploadController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/initiate", initiateUpload);
router.post("/part/:uploadId", upload.single("chunk"), uploadPart);
router.post("/complete/:uploadId",upload.single("thumbnail"), completeUpload);
router.delete("/abort/:uploadId", abortUpload);

export default router;