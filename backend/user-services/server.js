import dotenv from "dotenv";
import app from "./app.js";
dotenv.config();
// import { videoConsumer } from "./consumers/videoConsumer.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Start Kafka consumer
// videoConsumer();
