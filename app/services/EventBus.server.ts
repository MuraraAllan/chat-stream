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
    this.emitter.setMaxListeners(100); // Increase max listeners
  }

  subscribe(callback: (event: ChatEvent) => void) {
    this.emitter.on("chatEvent", callback);
    return () => this.emitter.off("chatEvent", callback);
  }

  publish(event: ChatEvent) {
    this.emitter.emit("chatEvent", event);
  }

  // Add this method to help with debugging
  getListenerCount() {
    return this.emitter.listenerCount("chatEvent");
  }
}

export const eventBus = new EventBus();
