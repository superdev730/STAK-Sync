// Utility functions for transforming technical error messages into user-friendly ones

export function getUserFriendlyErrorMessage(error: any): string {
  if (!error || !error.message) {
    return "Something went wrong. Please try again.";
  }

  const message = error.message.toLowerCase();

  // Registration-specific errors
  if (message.includes("already registered")) {
    return "You're already registered for this event.";
  }
  
  if (message.includes("full") || message.includes("capacity") || message.includes("no more spots")) {
    return "This event is full. No more spots available.";
  }
  
  if (message.includes("event not found") || message.includes("event could not be found")) {
    return "This event could not be found.";
  }
  
  if (message.includes("user not authenticated") || message.includes("unauthorized") || message.includes("sign in")) {
    return "Please sign in to continue.";
  }
  
  if (message.includes("payment") && message.includes("failed")) {
    return "Payment processing failed. Please check your payment information and try again.";
  }
  
  if (message.includes("network") || message.includes("connection")) {
    return "Connection issue. Please check your internet and try again.";
  }
  
  if (message.includes("timeout")) {
    return "Request timed out. Please try again.";
  }
  
  if (message.includes("invalid") && message.includes("email")) {
    return "Please enter a valid email address.";
  }
  
  if (message.includes("password") && message.includes("invalid")) {
    return "Invalid password. Please try again.";
  }
  
  // If the message is already user-friendly (doesn't contain technical indicators), return as-is
  if (!containsTechnicalIndicators(message)) {
    return error.message;
  }
  
  // Default fallback for unknown errors
  return "Something went wrong. Please try again.";
}

function containsTechnicalIndicators(message: string): boolean {
  const technicalIndicators = [
    "error:",
    "failed to",
    "internal server error",
    "500:",
    "400:",
    "404:",
    "401:",
    "403:",
    "http",
    "api",
    "database",
    "sql",
    "json",
    "undefined",
    "null",
    "exception",
    "stack trace"
  ];
  
  return technicalIndicators.some(indicator => message.includes(indicator));
}

export function getErrorTitle(error: any): string {
  if (!error || !error.message) {
    return "Error";
  }

  const message = error.message.toLowerCase();

  if (message.includes("register") || message.includes("registration")) {
    return "Unable to Register";
  }
  
  if (message.includes("payment")) {
    return "Payment Error";
  }
  
  if (message.includes("auth") || message.includes("sign in") || message.includes("login")) {
    return "Authentication Required";
  }
  
  if (message.includes("network") || message.includes("connection")) {
    return "Connection Error";
  }
  
  return "Error";
}