import { portkeyEncode, portkeyDoorman } from "~/utils/portkeyClient.server";
import { NodeData } from "~/types/graph";
import mergedGraph from "~/data/graph";
import "dotenv/config";

export class AIService {
  async processMessage(
    message: string,
    graphData: NodeData[],
    userId: string,
    send: (data: string) => void
  ) {
    const systemPrompt = process.env.DOORMAN_SYSTEM_PROMPT;
    console.log("system prompt is", systemPrompt);
    const pendingMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const responseDoorman = await portkeyDoorman.chat.completions.create({
      messages: pendingMessages,
      stream: false,
    });

    const textDoormanResponse = responseDoorman.choices[0].message?.content;
    console.log("answer doorman is", textDoormanResponse);
    if (
      textDoormanResponse?.includes("not sure") ||
      textDoormanResponse?.includes(`false`)
    ) {
      send(
        JSON.stringify({
          type: "message",
          data: {
            message:
              "I'm here to showcase Allan's professional experience and provide information about his skills, education, and more. \n You can try something like \n * Q : What is allan's experience with javascript? \n \n or anything more generic like  \n \n * Q: What you know ? ",
            isAI: true,
            isPartial: false,
          },
        })
      );
      return;
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
            { role: "user", content: textDoormanResponse || "" },
          ],
          stream: true,
        },
        {
          cacheForceRefresh: true,
        }
      );

      let accumulatedResponse = "";

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const partialContent = chunk.choices[0].delta.content;
          accumulatedResponse += partialContent;

          send(
            JSON.stringify({
              type: "message",
              data: {
                message: partialContent,
                isAI: true,
                isPartial: true,
              },
            })
          );
        }
      }

      console.log("Accumulated response:", accumulatedResponse);

      const convertToValidJSON = (str: string) => {
        let converted = str.replace(/'([^']+)':/g, '"$1":');
        const templateLiteralMatch = converted.match(/`([\s\S]*)`/);
        if (templateLiteralMatch) {
          const templateLiteralContent = templateLiteralMatch[1];
          const jsonEscapedContent = JSON.stringify(templateLiteralContent);
          converted = converted.replace(/`[\s\S]*`/, jsonEscapedContent);
        }
        if (!converted.trim().endsWith("}")) {
          converted += "}";
        }
        return converted;
      };

      const validJSONString = convertToValidJSON(
        accumulatedResponse.replace(/```json|```/g, "")
      );
      const jsonResult = JSON.parse(validJSONString);
      console.log("RESULT IS >>>>", jsonResult);

      if (jsonResult.ACTIVE_NODES && Array.isArray(jsonResult.ACTIVE_NODES)) {
        send(
          JSON.stringify({
            type: "updateGraph",
            data: {
              activeNodes: jsonResult.ACTIVE_NODES,
            },
          })
        );
      }

      send(
        JSON.stringify({
          type: "message",
          data: {
            message: jsonResult.AIassistant_answer,
            isAI: true,
            isPartial: false,
          },
        })
      );

      console.log("--- Message processing completed ---");
    } catch (error) {
      console.error("Error processing message with AI:", error);
      send(
        JSON.stringify({
          type: "message",
          data: {
            message: "Sorry, I couldn't process your request.",
            isAI: true,
            isPartial: false,
          },
        })
      );
    }
  }
}

export const aiService = new AIService();
