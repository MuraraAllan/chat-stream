import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";

type Message = {
  content: string;
  isComplete: boolean;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const messageFetcher = useFetcher();
  const actionFetcher = useFetcher();

  useEffect(() => {
    const eventSource = new EventSource("/retrieveChat");

    eventSource.onmessage = (event) => {
      try {
        console.log("received event", event);
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          console.log("hello world", data);
          setMessages((prev) => {
            // find
            const lastMessage = prev[prev.length - 1];
            console.log("i'm updating optimistically. ", data);
            if (lastMessage && !lastMessage.isComplete) {
              const updatedMessages = [...prev.slice(0, -1)];
              updatedMessages.push({
                content: lastMessage.content + data.message,
                isComplete: data.isComplete,
              });
              return updatedMessages;
            } else {
              return [
                ...prev,
                { content: data.message, isComplete: data.isComplete },
              ];
            }
          });
        } else if (data.type === "action") {
          setActions((prev) => [...prev, data.actionType]);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      messageFetcher.submit(
        { message },
        { method: "post", action: "/chat/message" }
      );
    },
    [messageFetcher]
  );

  const sendAction = useCallback(
    (actionType: string) => {
      actionFetcher.submit(
        { actionType },
        { method: "post", action: "/chat/action" }
      );
    },
    [actionFetcher]
  );

  return (
    <div>
      <div>
        <h2>Messages:</h2>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.content}
            {!msg.isComplete && "..."}
          </div>
        ))}
      </div>
      <div>
        <h2>Actions:</h2>
        {actions.map((action, index) => (
          <div key={index}>{action}</div>
        ))}
      </div>
      <button
        onClick={() =>
          sendMessage("Hello, this is a long message that will be streamed!")
        }
      >
        Send Message
      </button>
      <button onClick={() => sendAction("wave")}>Send Action</button>
    </div>
  );
}
