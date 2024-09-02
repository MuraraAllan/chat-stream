import { Portkey } from "portkey-ai";

if (!process.env.PORTKEY_API_KEY) {
  throw new Error("PORTKEY_API_KEY is not set in the environment variables");
}

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_VIRTUAL_KEY is not set in the environment variables");
}

export const portkey = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY,
  virtualKey: process.env.GOOGLE_API_KEY,
});
