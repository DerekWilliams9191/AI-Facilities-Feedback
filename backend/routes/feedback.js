const express = require("express");
const AIService = require("../services/aiService");
const TicketService = require("../services/ticketService");
const { validateFeedbackRequest } = require("../middleware/validation");

const router = express.Router();
const aiService = new AIService();
const ticketService = new TicketService();

router.post("/submit", validateFeedbackRequest, async (req, res) => {
  try {
    const { description, location, userEmail } = req.body;

    console.log(`[Feedback API] New feedback received from ${location}`);

    // Generate a unique request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return immediate success response
    res.json({
      success: true,
      status: "received",
      message: "Your feedback has been received and is being processed",
      requestId: requestId,
    });

    // Process the request asynchronously
    processRequestAsync(requestId, { description, location, userEmail });
  } catch (error) {
    console.error("[Feedback API] Error processing request:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Async processing function
async function processRequestAsync(requestId, requestData) {
  try {
    console.log(
      `[Background Processing] Starting processing for request ${requestId}`,
    );
    const { description, location, userEmail } = requestData;

    const classificationResult = await aiService.classifyRequest(
      description,
      location,
    );

    if (!classificationResult.success) {
      console.error(
        `[Background Processing] Classification failed for ${requestId}:`,
        classificationResult.error,
      );
      const reviewResult = await ticketService.flagForManualReview(
        requestData,
        "Classification service failed",
      );
      console.log(
        `[Background Processing] Request ${requestId} flagged for manual review due to classification failure`,
      );
      return;
    }

    if (classificationResult.needsManualReview) {
      const reviewResult = await ticketService.flagForManualReview(
        requestData,
        classificationResult.reason,
      );
      console.log(
        `[Background Processing] Request ${requestId} flagged for manual review: ${classificationResult.reason}`,
      );
      return;
    }

    const existingTickets = await ticketService.getTicketsByLocation(location);
    const duplicateCheck = await aiService.checkForDuplicates(
      description,
      location,
      classificationResult.category,
      existingTickets,
    );

    if (duplicateCheck.isDuplicate) {
      const duplicateResult = await ticketService.markAsDuplicate(
        requestData,
        duplicateCheck.duplicateTickets,
      );
      console.log(
        `[Background Processing] Request ${requestId} marked as duplicate`,
      );
      return;
    }

    const ticketResult = await ticketService.createTicket({
      description,
      location,
      userEmail,
      category: classificationResult.category,
    });

    if (!ticketResult.success) {
      console.error(
        `[Background Processing] Failed to create ticket for ${requestId}:`,
        ticketResult.error,
      );
      const reviewResult = await ticketService.flagForManualReview(
        requestData,
        "Ticket creation failed",
      );
      console.log(
        `[Background Processing] Request ${requestId} flagged for manual review due to ticket creation failure`,
      );
      return;
    }

    console.log(
      `[Background Processing] Successfully created ticket for request ${requestId}: ${ticketResult.ticket.id}`,
    );
  } catch (error) {
    console.error(
      `[Background Processing] Error processing request ${requestId}:`,
      error,
    );
    const reviewResult = await ticketService.flagForManualReview(
      requestData,
      "Processing error: " + error.message,
    );
    console.log(
      `[Background Processing] Request ${requestId} flagged for manual review due to processing error`,
    );
  }
}

module.exports = router;

