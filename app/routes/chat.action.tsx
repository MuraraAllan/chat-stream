import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createChatEventListener } from "~/utils/chatEventListner.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  const listener = createChatEventListener(request);
  listener.dispatch({ type: "action", data: { actionType } });

  return json({ success: true });
};
