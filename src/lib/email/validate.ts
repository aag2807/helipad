export function assertValidSendMailPayload(input: any) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload must be an object.");
  }

  const { to, subject, htmlBody } = input;

  if (!Array.isArray(to) || to.length === 0) {
    throw new Error("'to' must be a non-empty array.");
  }

  for (const addr of to) {
    if (typeof addr !== "string" || !addr.includes("@")) {
      throw new Error("Invalid recipient address.");
    }
  }

  if (typeof subject !== "string" || subject.trim().length === 0) {
    throw new Error("'subject' must be a non-empty string.");
  }

  if (typeof htmlBody !== "string" || htmlBody.trim().length === 0) {
    throw new Error("'htmlBody' must be a non-empty string.");
  }

  // Optional: size limits
  if (subject.length > 200) {
    throw new Error("Subject too long.");
  }

  if (htmlBody.length > 200_000) {
    throw new Error("Body too large.");
  }
}
