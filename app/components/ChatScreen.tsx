import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useSharedState } from "../context/SharedStateContext";

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
  const { messages, isProcessing, sendMessage } = useSharedState();
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessage = (content: string) => {
    return content.replace(/\n/g, "  \n");
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={chatContainerRef}
        className="flex-grow mb-4 bg-white rounded-lg shadow-md p-4 overflow-y-auto"
      >
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
                  className="markdown-content"
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
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
                >
                  {formatMessage(msg.content)}
                </ReactMarkdown>
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
      </div>
    </div>
  );
}
