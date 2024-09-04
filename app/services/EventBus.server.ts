import { EventEmitter } from "events";

export type ChatEvent = {
  type: "message" | "action" | "updateGraph";
  data: Record<string, unknown>;
  userId: string;
};

class EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(callback: (event: ChatEvent) => void) {
    this.emitter.on("chatEvent", callback);
    return () => this.emitter.off("chatEvent", callback);
  }

  publish(event: ChatEvent) {
    this.emitter.emit("chatEvent", event);
  }
}

export const eventBus = new EventBus();
