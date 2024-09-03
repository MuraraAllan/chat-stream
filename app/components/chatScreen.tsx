import { useEffect, useState, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

type Message = {
  content: string;
  isAI: boolean;
};

const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={tomorrow}
      wrapLongLines={true}
    >
      {value}
    </SyntaxHighlighter>
  );
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
            setMessages((prev) => {
              const newMessages = prev.filter((msg, index, array) => {
                if (!msg.isAI) return true;
                return (
                  index < array.length - 1 || !array[array.length - 1].isAI
                );
              });

              newMessages.push({ content: data.data.message, isAI: true });

              return newMessages;
            });
            if (data.data.isPartial === false) {
              setIsProcessing(false);
            }
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

  const formatMessage = (content: string) => {
    return content.replace(/\n/g, "  \n");
  };

  return (
    <div className="p-4 max-w-6xl mx-auto h-screen flex flex-col">
      <div className="flex-grow mb-4 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
        <ul className="space-y-4">
          {messages.map((msg, index) => (
            <li
              key={index}
              className={`p-2 rounded-lg ${
                msg.isAI ? "bg-gray-100" : "bg-blue-100 text-right"
              }`}
            >
              <strong>{msg.isAI ? "AI: " : "You: "}</strong>
              {msg.isAI ? (
                <ReactMarkdown
                  children={formatMessage(msg.content)}
                  className="markdown-content"
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).replace(/\n$/, "")}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                />
              ) : (
                msg.content
              )}
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
