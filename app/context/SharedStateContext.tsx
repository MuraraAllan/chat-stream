import { createContext, useContext, useState, useLayoutEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { NodeData } from "~/types/graph";

type Message = {
  content: string;
  isAI: boolean;
};

interface SharedStateContextType {
  messages: Message[];
  isProcessing: boolean;
  sendMessage: (message: string) => void;
  graphData: NodeData;
  updateGraphData: (newGraphData: NodeData) => void;
}

const SharedStateContext = createContext<SharedStateContextType | undefined>(
  undefined
);

export const SharedStateProvider: React.FC<{
  children: React.ReactNode;
  initialGraphData: NodeData;
}> = ({ children, initialGraphData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [graphData, setGraphData] = useState<NodeData>(initialGraphData);
  const messageFetcher = useFetcher();

  useLayoutEffect(() => {
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
        } else if (data.type === "updateGraphState") {
          setGraphData(data.data.graphState);
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

  const sendMessage = (message: string) => {
    if (message.trim() === "") return;

    setMessages((prev) => [...prev, { content: message, isAI: false }]);
    messageFetcher.submit(
      { message, graphState: JSON.stringify(graphData) },
      { method: "post", action: "/chat/message" }
    );
    setIsProcessing(true);
  };

  const updateGraphData = (newGraphData: NodeData) => {
    setGraphData(newGraphData);
  };

  return (
    <SharedStateContext.Provider
      value={{
        messages,
        isProcessing,
        sendMessage,
        graphData,
        updateGraphData,
      }}
    >
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => {
  const context = useContext(SharedStateContext);
  if (context === undefined) {
    throw new Error("useSharedState must be used within a SharedStateProvider");
  }
  return context;
};
