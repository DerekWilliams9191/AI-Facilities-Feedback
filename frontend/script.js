// DOM Elements
const form = document.getElementById("feedbackForm");
const locationInput = document.getElementById("location");
const descriptionInput = document.getElementById("description");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submitBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const messageArea = document.getElementById("messageArea");
const charCount = document.getElementById("charCount");

// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? "http://localhost:3000/api" : "/api";

// Track form state for unsaved changes warning
let hasUnsavedChanges = false;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  // Parse URL parameters for location (QR code support)
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get("location") || urlParams.get("loc");

  if (locationParam) {
    locationInput.value = decodeURIComponent(locationParam);
    // Focus on description if location is pre-filled
    descriptionInput.focus();
  } else {
    // Focus on location input if not pre-filled
    locationInput.focus();
  }

  // Initialize character counter
  updateCharCounter();
}

function setupEventListeners() {
  // Form submission
  form.addEventListener("submit", handleFormSubmit);

  // Character counter for description
  descriptionInput.addEventListener("input", updateCharCounter);

  // Real-time validation
  locationInput.addEventListener("blur", validateLocation);
  emailInput.addEventListener("blur", validateEmail);

  // Clear messages when user starts typing
  [locationInput, descriptionInput, emailInput].forEach((input) => {
    input.addEventListener("input", clearMessages);
  });

  // Track form changes for unsaved changes warning
  [locationInput, descriptionInput, emailInput].forEach((input) => {
    input.addEventListener("input", () => {
      hasUnsavedChanges = true;
    });
  });

  // Warn user about unsaved changes when navigating away
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return "You have unsaved changes. Are you sure you want to leave?";
    }
  });
}

function updateCharCounter() {
  const count = descriptionInput.value.length;
  charCount.textContent = count;

  // Change color based on length
  if (count < 15) {
    charCount.style.color = "#e74c3c";
  } else {
    charCount.style.color = "#27ae60";
  }
}

function validateLocation() {
  const location = locationInput.value.trim();
  if (!location) {
    showFieldError(locationInput, "Location is required");
    return false;
  }
  clearFieldError(locationInput);
  return true;
}

function validateEmail() {
  const email = emailInput.value.trim();
  if (email && !isValidEmail(email)) {
    showFieldError(emailInput, "Please enter a valid email address");
    return false;
  }
  clearFieldError(emailInput);
  return true;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showFieldError(field, message) {
  clearFieldError(field);

  field.style.borderColor = "#e74c3c";
  field.classList.add("shake");

  const errorDiv = document.createElement("div");
  errorDiv.className = "field-error";
  errorDiv.style.color = "#e74c3c";
  errorDiv.style.fontSize = "0.85rem";
  errorDiv.style.marginTop = "0.25rem";
  errorDiv.textContent = message;

  field.parentNode.appendChild(errorDiv);

  setTimeout(() => field.classList.remove("shake"), 500);
}

function clearFieldError(field) {
  field.style.borderColor = "";
  const existingError = field.parentNode.querySelector(".field-error");
  if (existingError) {
    existingError.remove();
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  // Validate form
  const isLocationValid = validateLocation();
  const isEmailValid = validateEmail();
  const description = descriptionInput.value.trim();

  if (!isLocationValid || !isEmailValid || !description) {
    if (!description) {
      showFieldError(descriptionInput, "Please describe the problem");
    }
    showMessage("Please correct the errors above and try again.", "error");
    return;
  }

  if (description.length < 15) {
    showFieldError(
      descriptionInput,
      "Please provide a more detailed description (at least 15 characters)",
    );
    showMessage("Please provide more details about the problem.", "error");
    return;
  }

  // Prepare form data
  const formData = {
    location: locationInput.value.trim(),
    description: description,
    userEmail: emailInput.value.trim() || null,
  };

  // Submit form
  await submitForm(formData);
}

async function submitForm(formData) {
  try {
    // Show loading state
    setLoadingState(true);

    const response = await fetch(`${API_BASE_URL}/feedback/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      handleSubmissionSuccess(result);
    } else {
      handleSubmissionError(result);
    }
  } catch (error) {
    console.error("Submission error:", error);
    handleSubmissionError({
      message:
        "Unable to connect to the server. Please check your internet connection and try again.",
    });
  } finally {
    setLoadingState(false);
  }
}

function handleSubmissionSuccess(result) {
  let message = "✓ Your report has been submitted successfully!";

  if (result.requestId) {
    message += ` We're processing your request now. Reference ID: ${result.requestId}`;
  }

  showMessage(message, "success");

  // Clear unsaved changes flag since form was submitted successfully
  hasUnsavedChanges = false;

  // Clear form
  form.reset();
  updateCharCounter();

  // If location came from URL, restore it
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get("location") || urlParams.get("loc");
  if (locationParam) {
    locationInput.value = decodeURIComponent(locationParam);
  }

  // Scroll to message
  messageArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handleSubmissionError(error) {
  const message =
    error.message ||
    "An error occurred while submitting your report. Please try again.";
  showMessage(`✗ ${message}`, "error");

  // Scroll to message
  messageArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  loadingSpinner.style.display = isLoading ? "block" : "none";

  if (isLoading) {
    submitBtn.textContent = "Submitting...";
  } else {
    submitBtn.textContent = "Submit Report";
  }
}

function showMessage(message, type = "info") {
  messageArea.textContent = message;
  messageArea.className = `message-area ${type}`;
  messageArea.style.display = "block";

  // Auto-hide success messages after 10 seconds
  if (type === "success") {
    setTimeout(() => {
      messageArea.style.display = "none";
    }, 10000);
  }
}

function clearMessages() {
  if (
    messageArea.classList.contains("error") ||
    messageArea.classList.contains("warning")
  ) {
    messageArea.style.display = "none";
  }
}

// Handle offline/online status
window.addEventListener("online", () => {
  showMessage("✓ Connection restored", "success");
});

window.addEventListener("offline", () => {
  showMessage(
    "⚠ You are currently offline. Your report will be submitted when connection is restored.",
    "warning",
  );
});

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

