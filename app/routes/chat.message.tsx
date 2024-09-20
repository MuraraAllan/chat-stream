import { ActionFunction } from "@remix-run/node";
import { aiService } from "~/services/AIService.server";
import { getUserId } from "~/utils/userStore.server";
import { NodeData } from "~/types/graph";
import mergedGraph from "~/data/graph";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const graphState = mergedGraph as NodeData[];

  const userId = getUserId(request);

  console.log(`Processing message for user ${userId}: ${message}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      // Send user message
      send(JSON.stringify({ type: "message", data: { message, isAI: false } }));

      // Process the message with AI
      aiService
        .processMessage(message, graphState, userId, send)
        .then(() => controller.close())
        .catch((error) => {
          console.error("Error processing message:", error);
          send(
            JSON.stringify({
              type: "message",
              data: {
                message: "An error occurred while processing your message.",
                isAI: true,
                isPartial: false,
              },
            })
          );
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
