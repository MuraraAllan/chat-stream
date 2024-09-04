import { getUserId, getUserIdCookie } from "~/utils/userStore.server";
import { eventBus, ChatEvent } from "~/services/EventBus.server";
import { aiService } from "~/services/AIService.server";
import { NodeData } from "~/types/graph";

class EventListenerController {
  createListener(request: Request) {
    const userId = getUserId(request);
    console.log(`Creating event listener for user ${userId}`);

    const stream = new ReadableStream({
      start: (controller) => {
        const encoder = new TextEncoder();

        const send = (data: string) => {
          console.log(`Sending data to user ${userId}:`, data);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const unsubscribe = eventBus.subscribe((event: ChatEvent) => {
          if (event.userId === userId) {
            console.log(`Received event for user ${userId}:`, event);
            send(JSON.stringify(event));
          }
        });

        send(JSON.stringify({ type: "ping", data: "Connection established" }));

        request.signal.addEventListener("abort", () => {
          console.log(`Closing SSE connection for user ${userId}`);
          unsubscribe();
          controller.close();
        });
      },
    });

    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    headers.append("Set-Cookie", getUserIdCookie(userId));

    return new Response(stream, { headers });
  }
  async processMessageWithAI(
    message: string,
    graphData: NodeData,
    userId: string
  ) {
    const result = await aiService.processMessage(message, graphData, userId);
    console.log("RESULT ON CONTROLLER IS >>>", result);
    return result;
  }

  dispatchEvent(event: Omit<ChatEvent, "userId">, userId: string) {
    console.log(`Dispatching event for user ${userId}:`, event);
    eventBus.publish({ ...event, userId });
  }
}

const eventListenerController = new EventListenerController();

export { eventListenerController };
