/**
 * Mock push notification service.
 * Would normally integrate with FCM, APNs, or a push provider.
 */
export async function sendPush(notification) {
  await new Promise((r) => setTimeout(r, 30));

  console.log("---------- PUSH SENT ----------");
  console.log(`  Device:  user:${notification.userId}`);
  console.log(`  Title:   ${notification.title}`);
  console.log(`  Body:    ${notification.message}`);
  if (notification.data && Object.keys(notification.data).length > 0) {
    console.log(`  Data:    ${JSON.stringify(notification.data)}`);
  }
  console.log("--------------------------------");

  return { success: true, provider: "mock-fcm" };
}
