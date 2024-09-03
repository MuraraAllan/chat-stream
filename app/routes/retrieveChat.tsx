import type { LoaderFunction } from "@remix-run/node";
import { eventListenerController } from "~/utils/EventListenerController.server";

export const loader: LoaderFunction = async ({ request }) => {
  return eventListenerController.createListener(request);
};
