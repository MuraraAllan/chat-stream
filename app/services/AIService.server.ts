import { NodeData } from "~/types/graph";
import { eventBus } from "./EventBus.server";
import { portkey } from "~/utils/portkeyClient.server";

export class AIService {
  async processMessage(message: string, graphData: NodeData, userId: string) {
    try {
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
          eventBus.publish({
            type: "message",
            data: {
              message: accumulatedResponse,
              isAI: true,
              isPartial: true,
            },
            userId,
          });
        }
      }

      // Publish the complete response
      eventBus.publish({
        type: "message",
        data: {
          message: accumulatedResponse,
          isAI: true,
          isPartial: false,
        },
        userId,
      });

      // Here you would process the AI response to update the graph state
      // For now, we'll just return the original graph data
      return { graphState: graphData };
    } catch (error) {
      console.error("Error processing message with AI:", error);
      eventBus.publish({
        type: "message",
        data: {
          message: "Sorry, I couldn't process your request.",
          isAI: true,
          isPartial: false,
        },
        userId,
      });
      return { graphState: graphData };
    }
  }
}

export const aiService = new AIService();
