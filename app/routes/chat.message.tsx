import { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { eventListenerController } from "~/utils/EventListenerController.server";
import { getUserId } from "~/utils/userStore.server";
import { NodeData } from "~/types/graph";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const graphState = JSON.parse(
    formData.get("graphState") as string
  ) as NodeData;

  const userId = getUserId(request);

  console.log(`Dispatching message for user ${userId}: ${message}`);
  eventListenerController.dispatchEvent(
    { type: "message", data: { message, isAI: false } },
    userId
  );

  // Process the message with AI
  const aiResponse = await eventListenerController.processMessageWithAI(
    message,
    graphState,
    userId
  );

  // Update the graph based on AI response
  // You might need to parse the AI response to extract graph data
  // c
  console.log("ai response is", aiResponse);
  const newGraphData = aiResponse;
  eventListenerController.dispatchEvent(
    { type: "updateGraph", data: { newGraphData } },
    userId
  );

  return json({ success: true });
};
