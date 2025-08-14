const express = require("express");
const cors = require("cors");
const feedbackRoutes = require("./routes/feedback");
const { errorHandler, requestLogger } = require("./middleware/validation");
const database = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(requestLogger);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "WSU Facilities Feedback Reporter API",
    version: "1.0.0",
    endpoints: {
      "POST /api/feedback/submit": "Submit a new feedback request",
    },
  });
});

app.use("/api/feedback", feedbackRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(
    `WSU Facilities Feedback Reporter API is running on port ${PORT}`,
  );
  console.log(`API Documentation available at: http://localhost:${PORT}`);
  
  // Test database connection
  await database.testConnection();
});
