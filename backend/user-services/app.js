import express from "express";
import videoRoutes from "./routes/videoRoutes.js";
import morgan from "morgan";
import cors from "cors";

const app = express();

app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For URL-encoded payloads
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000", // Specify exact frontend origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/upload", videoRoutes);

export default app;
