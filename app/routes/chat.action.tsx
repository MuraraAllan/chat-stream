import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { eventListenerController } from "~/utils/EventListenerController.server";
import { getUserId } from "~/utils/userStore.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;
  const message = formData.get("message") as string;

  const userId = getUserId(request);

  console.log(`Dispatching action for user ${userId}: ${actionType}`);
  eventListenerController.dispatchEvent(
    { type: "action", data: { actionType, message } },
    userId
  );

  return json({ success: true });
};
