import { EventEmitter } from "events";
import { getUserId, getUserIdCookie } from "~/utils/userStore.server";
import { portkey } from "~/utils/portkeyClient.server";
import { NodeData } from "~/types/graph";

type ChatEvent = {
  type: "message" | "action" | "updateGraph";
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
          if (event.userId === userId) {
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

  async processMessageWithAI(
    message: string,
    graphData: NodeData,
    userId: string
  ) {
    try {
      console.log("Received message");

      const systemPrompt =
        process.env.AI_SYSTEM_PROMPT?.replace(
          "{{GRAPH_DATA}}",
          JSON.stringify(graphData, null, 2)
        ) || "";

      const response = await portkey.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      });

      let accumulatedResponse = "";

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const partialContent = chunk.choices[0].delta.content;
          accumulatedResponse += partialContent;
          this.dispatchEvent(
            {
              type: "message",
              data: {
                message: accumulatedResponse,
                isAI: true,
                isPartial: true,
              },
            },
            userId
          );
        }
      }

      // Parse the accumulated response
      const answerMatch = accumulatedResponse.match(
        /ANSWER:([\s\S]*?)ACTIVE_NODES:/
      );
      const nodesMatch = accumulatedResponse.match(/ACTIVE_NODES:([\s\S]*)/);

      let answer = "";
      let activeNodes: string[] = [];

      if (answerMatch && answerMatch[1]) {
        answer = answerMatch[1].trim();
      }

      if (nodesMatch && nodesMatch[1]) {
        try {
          activeNodes = JSON.parse(nodesMatch[1].trim());
        } catch (parseError) {
          console.error("Error parsing active nodes:", parseError);
        }
      }

      const graphState: GraphState = { activeNodes };

      // Dispatch the complete response
      console.log("answer is", accumulatedResponse);
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

      // Dispatch the updated graph state
      this.dispatchEvent(
        {
          type: "updateGraphState",
          data: {
            graphState,
          },
        },
        userId
      );

      return { answer, graphState };
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
      return {
        answer: "Error processing request",
        graphState: { activeNodes: [] },
      };
    }
  }

  dispatchEvent(event: Omit<ChatEvent, "userId">, userId: string) {
    const fullEvent: ChatEvent = { ...event, userId };
    this.emitter.emit("chatEvent", fullEvent);
  }
}

// Singleton instance
const eventListenerController = new EventListenerController();

export { eventListenerController };
