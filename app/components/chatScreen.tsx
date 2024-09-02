import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";

type Message = {
  content: string;
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
        console.log("Received event:", event.data);
        const data = JSON.parse(event.data);
        if (data.type === "action") {
          console.log("Received action:", data.data.actionType);
          setActions((prev) => [...prev, data.data.actionType]);
        } else if (data.type === "message") {
          console.log("Received message:", data.data.message);
          setMessages((prev) => [...prev, { content: data.data.message }]);
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
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Messages:</h2>
        <ul className="list-disc pl-5">
          {messages.map((msg, index) => (
            <li key={index} className="mb-1">
              {msg.content}
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Actions:</h2>
        <ul className="list-disc pl-5">
          {actions.map((action, index) => (
            <li key={index} className="mb-1">
              {action}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => sendMessage("Hello, this is a test message!")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Send Message
        </button>
        <button
          onClick={() => sendAction("test_action")}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Send Action
        </button>
      </div>
    </div>
  );
}
