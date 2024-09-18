import { portkeyEncode, portkeyDoorman } from "~/utils/portkeyClient.server";
import { NodeData } from "~/types/graph";
import { eventBus } from "./EventBus.server";
import mergedGraph from "~/data/graph";
import 'dotenv/config'

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

export class AIService {
  async processMessage(message: string, graphData: NodeData[], userId: string) {
    // console.log("--- Processing message ---");
    // console.log("Input message:", message);
    // console.log("Input graphData:");

    const systemPrompt = process.env.DOORMAN_SYSTEM_PROMPT;

    let pendingMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];
    // console.log("sending ppendg", pendingMessages);
    const responseDoorman = await portkeyDoorman.chat.completions.create({
      messages: [...pendingMessages],
      stream: false,
    });

    let textDoormanResponse = responseDoorman.choices[0].message?.content;
    console.log("answer doorman is", textDoormanResponse);
    if (textDoormanResponse.includes("not sure")) {
      eventBus.publish({
        type: "message",
        data: {
          message:
            "Invalid request, make sure it is related to Allan, projects, or this system",
          isAI: true,
          isPartial: false,
        },
        userId,
      });

      console.log("--- Message processing completed ---");

      return {
        graphState: graphData,
        aiResponse:
          "Invalid request, make sure it is related to Allan, projects, or this system.",
      };
    }

    try {
      const systemPrompt2 =
        process.env.AI_SYSTEM_PROMPT2?.replace(
          "{{GRAPH_DATA}}",
          JSON.stringify(mergedGraph, null, 2)
        ) || "";

      const response = await portkeyEncode.chat.completions.create(
        {
          messages: [
            { role: "system", content: systemPrompt2 },
            { role: "user", content: textDoormanResponse },
          ],
          stream: true,
        },
        {
          cacheForceRefresh: true,
        }
      );

      let accumulatedResponse = "";
      let activeNodesFromAI: string[] = [];

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

      console.log("Accumulated response:", accumulatedResponse);

      const convertToValidJSON = (str) => {
        // Replace single quotes with double quotes for property names
        let converted = str.replace(/'([^']+)':/g, '"$1":');

        // Find the template literal and replace it with a valid JSON string
        const templateLiteralMatch = converted.match(/`([\s\S]*)`/);
        if (templateLiteralMatch) {
          const templateLiteralContent = templateLiteralMatch[1];
          const jsonEscapedContent = JSON.stringify(templateLiteralContent);
          converted = converted.replace(/`[\s\S]*`/, jsonEscapedContent);
        }
        if (converted.trim().endsWith("}") == false) {
          converted += "}";
        }
        return converted;
      };

      // Convert the response to valid JSON and parse it
      const validJSONString = convertToValidJSON(
        accumulatedResponse.replace(/```json|```/g, "")
      );
      const jsonResult = JSON.parse(validJSONString); // const result = accumulatedResponse.replace(/```|```/g, "");
      // const jsonResult = JSON.parse(accumulatedResponse);
      console.log("RESULT IS >>>>", jsonResult);

      // Remove the ACTIVE_NODES part from the response
      // const cleanedResponse = accumulatedResponse
      //   .replace(/ACTIVE_NODES:\s*\[.*?\]/, "")
      //   .trim();

      // Expand active nodes to include their children
      let expandedActiveNodes = jsonResult.ACTIVE_NODES;
      for (const nodeName of jsonResult.ACTIVE_NODES) {
        const node = graphData.find((n) => n.name === nodeName);
        if (node) {
          expandedActiveNodes = expandedActiveNodes.concat(
            getAllChildrenNames(node)
          );
        }
      }

      // Remove duplicates
      expandedActiveNodes = Array.from(new Set(expandedActiveNodes));

      // Update graphData with expanded active nodes
      const updatedGraphData = graphData.map((node) => ({
        ...node,
        activeNodes: expandedActiveNodes.includes(node.name)
          ? expandedActiveNodes
          : undefined,
      }));

      eventBus.publish({
        type: "message",
        data: {
          message: jsonResult.AIassistant_answer,
          isAI: true,
          isPartial: false,
        },
        userId,
      });

      eventBus.publish({
        type: "updateGraph",
        data: {
          newGraphData: updatedGraphData,
        },
        userId,
      });

      console.log("--- Message processing completed ---");

      return {
        graphState: updatedGraphData,
        aiResponse: jsonResult.AIassistant_answer,
      };
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
