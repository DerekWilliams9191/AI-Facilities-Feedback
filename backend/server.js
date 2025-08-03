const express = require("express");
const cors = require("cors");
const feedbackRoutes = require("./routes/feedback");
const { errorHandler, requestLogger } = require("./middleware/validation");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "WSU Facilities Feedback Reporter API",
    version: "1.0.0",
    endpoints: {
      "POST /api/feedback/submit": "Submit a new feedback request",
      "GET /api/feedback/tickets": "Get all tickets or filter by location",
      "GET /api/feedback/tickets/:id": "Get a specific ticket",
      "PATCH /api/feedback/tickets/:id/status": "Update ticket status"
    }
  });
});

app.use("/api/feedback", feedbackRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`WSU Facilities Feedback Reporter API is running on port ${PORT}`);
  console.log(`API Documentation available at: http://localhost:${PORT}`);
});
