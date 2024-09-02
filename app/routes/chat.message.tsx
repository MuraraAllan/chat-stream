import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { eventListenerController } from "~/utils/EventListenerController.server";
import { getUserId } from "~/utils/userStore.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  const userId = getUserId(request);

  console.log(`Dispatching message for user ${userId}: ${message}`);
  eventListenerController.dispatchEvent(
    { type: "message", data: { message, isAI: false } },
    userId
  );

  // Process the message with AI
  await eventListenerController.processMessageWithAI(message, userId);

  return json({ success: true });
};
