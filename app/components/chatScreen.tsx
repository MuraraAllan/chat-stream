import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";

type Message = {
  content: string;
  isAI: boolean;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");

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
          setMessages((prev) => [
            ...prev,
            { content: data.data.message, isAI: data.data.isAI },
          ]);
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
        { method: "post", action: "/ai.request" }
      );
      setMessages((prev) => [...prev, { content: message, isAI: false }]);
      setInputMessage("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim());
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 bg-white shadow rounded-lg p-4 h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Chat:</h2>
        <ul className="space-y-2">
          {messages.map((msg, index) => (
            <li
              key={index}
              className={`p-2 rounded ${
                msg.isAI ? "bg-blue-100 text-blue-800" : "bg-gray-100"
              }`}
            >
              <strong>{msg.isAI ? "AI: " : "You: "}</strong>
              {msg.content}
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-grow border rounded p-2"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Send
        </button>
      </form>
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
      <div>
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
