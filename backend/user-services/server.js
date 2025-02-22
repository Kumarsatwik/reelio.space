import dotenv from "dotenv";
import app from "./app.js";
dotenv.config();
// import { videoConsumer } from "./consumers/videoConsumer.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start Kafka consumer
// videoConsumer();
