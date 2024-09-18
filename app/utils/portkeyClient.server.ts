import { Portkey } from "portkey-ai";

if (!process.env.PORTKEY_API_KEY) {
  throw new Error("PORTKEY_API_KEY is not set in the environment variables");
}
const portkeyDoorman = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY,
  config: process.env.PORTKEY_DOORMAN_CONFIG,
});

const portkeyEncode = new Portkey({
  apiKey: process.env.PORTKEY_API_KEY,
  config: process.env.PORTKEY_CONFIG,
});

export { portkeyDoorman, portkeyEncode };
