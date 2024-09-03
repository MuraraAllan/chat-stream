import { EventEmitter } from "events";
import { getUserId, getUserIdCookie } from "~/utils/userStore.server";
import { portkey } from "~/utils/portkeyClient.server";

type ChatEvent = {
  type: "message" | "action";
  data: Record<string, unknown>;
  userId: string;
};

class EventListenerController {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  createListener(request: Request) {
    const userId = getUserId(request);
    console.log(`Creating event listener for user ${userId}`);

    const stream = new ReadableStream({
      start: (controller) => {
        const encoder = new TextEncoder();

        const send = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };

        const listener = (event: ChatEvent) => {
          // console.log(`Received event for user ${userId}:`, event);
          if (event.userId === userId) {
            // console.log(`Sending event to user ${userId}`);
            send(JSON.stringify(event));
          }
        };

        this.emitter.on("chatEvent", listener);

        send(JSON.stringify({ type: "ping", data: "Connection established" }));

        request.signal.addEventListener("abort", () => {
          console.log(`Closing SSE connection for user ${userId}`);
          this.emitter.off("chatEvent", listener);
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

  async processMessageWithAI(message: string, userId: string) {
    try {
      console.log("Received message");
      const response = await portkey.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
        stream: true,
      });

      let accumulatedResponse = "";

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const partialContent = chunk.choices[0].delta.content;
          accumulatedResponse += partialContent;
          console.log("received partial", partialContent);
          // Dispatch the partial content to the client
          this.dispatchEvent(
            {
              type: "message",
              data: {
                message: partialContent,
                isAI: true,
                isPartial: true,
              },
            },
            userId
          );
        }
      }

      // Dispatch the complete response
      this.dispatchEvent(
        {
          type: "message",
          data: {
            message: accumulatedResponse,
            isAI: true,
            isPartial: false,
          },
        },
        userId
      );
    } catch (error) {
      console.error("Error processing message with AI:", error);
      this.dispatchEvent(
        {
          type: "message",
          data: {
            message: "Sorry, I couldn't process your request.",
            isAI: true,
            isPartial: false,
          },
        },
        userId
      );
    }
  }

  dispatchEvent(event: Omit<ChatEvent, "userId">, userId: string) {
    const fullEvent: ChatEvent = { ...event, userId };
    // console.log(`Dispatching event for user ${userId}:`, fullEvent);
    this.emitter.emit("chatEvent", fullEvent);
  }
}

// Singleton instance
const eventListenerController = new EventListenerController();

export { eventListenerController };
