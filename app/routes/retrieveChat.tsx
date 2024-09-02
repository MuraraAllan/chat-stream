import type { LoaderFunction } from "@remix-run/node";
import { createChatEventListener } from "~/utils/chatEventListner.server";

export const loader: LoaderFunction = async ({ request }) => {
  const listener = createChatEventListener(request);
  return listener.stream;
};
