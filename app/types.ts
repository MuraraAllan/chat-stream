export type ChatEvent = {
  type: "message" | "action";
  data: Record<string, unknown>;
  userId: string;
};
