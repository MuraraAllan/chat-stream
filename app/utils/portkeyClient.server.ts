import { PORTKEY_GATEWAY_URL, createHeaders } from "portkey-ai";
import OpenAI from "openai";

if (!process.env.PORTKEY_API_KEY) {
  throw new Error("PORTKEY_API_KEY is not set in the environment variables");
}

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not set in the environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  baseURL: PORTKEY_GATEWAY_URL,
  defaultHeaders: createHeaders({
    provider: "google",
    apiKey: process.env.PORTKEY_API_KEY,
  }),
});
