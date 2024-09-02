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
  const [isProcessing, setIsProcessing] = useState(false);

  const messageFetcher = useFetcher();
  const actionFetcher = useFetcher();

  useEffect(() => {
    const eventSource = new EventSource("/retrieveChat");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          if (data.data.isAI) {
            setMessages((prev) => [
              ...prev,
              { content: data.data.message, isAI: true },
            ]);
            setIsProcessing(false);
          }
        } else if (data.type === "action") {
          setActions((prev) => [...prev, data.data.actionType]);
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
      if (message.trim() === "") return;

      setMessages((prev) => [...prev, { content: message, isAI: false }]);
      messageFetcher.submit(
        { message },
        { method: "post", action: "/chat/message" }
      );
      setInputMessage("");
      setIsProcessing(true);
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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 bg-white rounded-lg shadow-md p-4 h-96 overflow-y-auto">
        <ul className="space-y-4">
          {messages.map((msg, index) => (
            <li
              key={index}
              className={`p-2 rounded-lg ${
                msg.isAI ? "bg-gray-100" : "bg-blue-100 text-right"
              }`}
            >
              {msg.isAI ? "AI: " : "You: "}
              {msg.content}
            </li>
          ))}
        </ul>
        {isProcessing && (
          <div className="p-2 rounded-lg bg-gray-100 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Actions:</h2>
        <ul className="list-disc list-inside">
          {actions.map((action, index) => (
            <li key={index} className="my-2">
              {action}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-grow border border-gray-300 rounded px-2 py-1"
          placeholder="Type your message..."
          onKeyPress={(e) => {
            if (e.key === "Enter") sendMessage(inputMessage);
          }}
        />
        <button
          onClick={() => sendMessage(inputMessage)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isProcessing}
        >
          Send
        </button>
        <button
          onClick={() => sendAction("wave")}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={isProcessing}
        >
          Wave
        </button>
      </div>
    </div>
  );
}
