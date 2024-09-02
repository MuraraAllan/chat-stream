// inspired by sse-chat of remix-utils https://github.com/sergiodxa/remix-utils/blob/main/src/server/event-stream.ts
// thanks for the piece of code
import { EventEmitter } from "events";
import { getUserId, getUserIdCookie } from "~/utils/userStore.server";

const emitter = new EventEmitter();

type ChatEvent = {
  type: "message" | "action";
  data: any;
  userId: string;
};

export function createChatEventListener(request: Request) {
  const userId = getUserId(request);
  console.log(`Creating chat event listener for user ${userId}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(data: string) {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      function listener(chatEvent: ChatEvent) {
        if (chatEvent.userId === userId) {
          send(JSON.stringify(chatEvent));
        }
      }

      emitter.on("chatEvent", listener);

      send(JSON.stringify({ type: "ping", data: "Connection established" }));

      request.signal.addEventListener("abort", () => {
        console.log(`Closing SSE connection for user ${userId}`);
        emitter.off("chatEvent", listener);
        controller.close();
      });
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Add the userId cookie to the response
  headers.append("Set-Cookie", getUserIdCookie(userId));

  return {
    stream: new Response(stream, { headers }),

    dispatch(event: Omit<ChatEvent, "userId">) {
      if (event.type === "message") {
        const fullMessage = event.data.message;
        const firstPart = fullMessage.slice(
          0,
          Math.floor(fullMessage.length * 0.3)
        );
        const secondPart = fullMessage.slice(
          Math.floor(fullMessage.length * 0.3)
        );

        emitter.emit("chatEvent", {
          ...event,
          userId,
          message: firstPart,
          isComplete: false,
        });

        setTimeout(() => {
          emitter.emit("chatEvent", {
            ...event,
            userId,
            message: secondPart,
            isComplete: true,
          });
        }, 1000); // Delay of 1 second for demonstration purposes
      } else {
        emitter.emit("chatEvent", { ...event, userId });
      }
    },
  };
}
