import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createChatEventListener } from "~/utils/chatEventListner.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  const listener = createChatEventListener(request);
  listener.dispatch({ type: "message", data: { message } });

  return json({ success: true });
};
