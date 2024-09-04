import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useSharedState } from "../context/SharedStateContext";

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

  const MarkdownComponents: Components = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-4">{children}</p>,
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
    ol: ({ children }) => (
      <ol className="list-decimal pl-5 mb-4">{children}</ol>
    ),
    li: ({ children }) => <li className="mb-2">{children}</li>,
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-2"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-100 rounded px-1 py-0.5" {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="flex justify-center items-center h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div
        className="w-full max-w-xl chat-container p-4 relative"
        style={{ zIndex: 10 }}
      >
        <div
          ref={chatContainerRef}
          className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-4 mb-4 overflow-y-auto"
          style={{
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            height: "70vh",
            transform: "scale(1.05)",
            transformOrigin: "center center",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg mb-3 message-animation ${
                msg.isAI
                  ? "bg-blue-100 bg-opacity-70"
                  : "bg-green-100 bg-opacity-70 ml-auto"
              }`}
              style={{
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                width: "70%",
              }}
            >
              <strong className="block mb-1 text-sm">
                {msg.isAI ? "AI: " : "You: "}
              </strong>
              {msg.isAI ? (
                <ReactMarkdown
                  components={MarkdownComponents}
                  className="markdown-content text-black text-sm"
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-right">{msg.content}</p>
              )}
            </div>
          ))}
          {isProcessing && (
            <div
              className="p-2 rounded-lg bg-gray-100 bg-opacity-70 mt-2 message-animation"
              style={{ width: "70%" }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
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
            className="flex-grow border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white bg-opacity-90 backdrop-blur-sm"
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isProcessing) {
                sendMessage(inputMessage);
                setInputMessage("");
              }
            }}
          />
          <button
            onClick={() => {
              if (!isProcessing) {
                sendMessage(inputMessage);
                setInputMessage("");
              }
            }}
            className="bg-blue-500 text-white px-6 py-2 rounded-r-lg text-sm glow-effect transition-colors duration-200 hover:bg-blue-600"
            disabled={isProcessing}
          >
            Send
          </button>
        </div>
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"
        style={{ zIndex: 1, filter: "blur(20px)" }}
      ></div>
    </div>
  );
}
