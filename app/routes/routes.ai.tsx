import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { openai } from "~/utils/portkeyClient.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const message = formData.get("message") as string;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: message }],
      model: "gemini-pro", // Use the appropriate Google model
    });

    const aiResponse = chatCompletion.choices[0].message.content;

    return json({ success: true, message: aiResponse });
  } catch (error) {
    console.error("Error processing AI request:", error);
    return json(
      { success: false, message: "Sorry, I couldn't process your request." },
      { status: 500 }
    );
  }
};
