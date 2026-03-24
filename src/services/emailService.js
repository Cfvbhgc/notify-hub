/**
 * Mock email service.
 * In a real system this would call SendGrid, SES, Mailgun, etc.
 */
export async function sendEmail(notification) {
  // Simulate a small delay like a real SMTP call
  await new Promise((r) => setTimeout(r, 50));

  console.log("========== EMAIL SENT ==========");
  console.log(`  To:      user:${notification.userId}`);
  console.log(`  Title:   ${notification.title}`);
  console.log(`  Message: ${notification.message}`);
  console.log("================================");

  return { success: true, provider: "mock-smtp" };
}
