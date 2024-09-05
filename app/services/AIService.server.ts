import { portkey } from "~/utils/portkeyClient.server";
import { NodeData } from "~/types/graph";
import { eventBus } from "./EventBus.server";

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
      let activeNodes: string[] = [];

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const partialContent = chunk.choices[0].delta.content;
          accumulatedResponse += partialContent;

          eventBus.publish({
            type: "message",
            data: {
              message: partialContent,
              isAI: true,
              isPartial: true,
            },
            userId,
          });
        }
      }

      // Extract active nodes from the response
      const activeNodesMatch = accumulatedResponse.match(
        /ACTIVE_NODES:\s*(\[.*?\])/
      );
      if (activeNodesMatch) {
        try {
          activeNodes = JSON.parse(activeNodesMatch[1]);
        } catch (error) {
          console.error("Error parsing active nodes:", error);
        }
      }

      // Function to recursively get all children names
      const getAllChildrenNames = (node: NodeData): string[] => {
        let childrenNames: string[] = [];
        if (node.children) {
          for (const child of node.children) {
            childrenNames.push(child.name);
            childrenNames = childrenNames.concat(getAllChildrenNames(child));
          }
        }
        return childrenNames;
      };

      // Expand active nodes to include their children
      let expandedActiveNodes = [...activeNodes];
      for (const nodeName of activeNodes) {
        const node = graphData.children?.find(
          (child) => child.name === nodeName
        );
        if (node) {
          expandedActiveNodes = expandedActiveNodes.concat(
            getAllChildrenNames(node)
          );
        }
      }

      // Remove duplicates
      expandedActiveNodes = Array.from(new Set(expandedActiveNodes));

      // Update graphData with expanded active nodes
      const updatedGraphData = {
        ...graphData,
        activeNodes: expandedActiveNodes,
      };

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

      // Publish the updated graph data
      eventBus.publish({
        type: "updateGraph",
        data: {
          newGraphData: updatedGraphData,
        },
        userId,
      });

      return { graphState: updatedGraphData, aiResponse: accumulatedResponse };
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
      return { graphState: graphData, aiResponse: "Error processing request" };
    }
  }
}

export const aiService = new AIService();
