import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const [graphData, setGraphData] = useState<NodeData>(initialGraphData);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messageFetcher = useFetcher();
  const currentAIMessageRef = useRef("");

  useEffect(() => {
    console.log("SharedStateProvider - Initial graphData:", graphData);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/retrieveChat");

    eventSource.onmessage = (event) => {
      console.log("Received SSE event:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          if (data.data.isAI) {
            if (data.data.isPartial) {
              currentAIMessageRef.current += data.data.message;
              setMessages((prev) => {
                const newMessages = [...prev];
                if (
                  newMessages.length > 0 &&
                  newMessages[newMessages.length - 1].isAI
                ) {
                  newMessages[newMessages.length - 1].content =
                    currentAIMessageRef.current;
                } else {
                  newMessages.push({
                    content: currentAIMessageRef.current,
                    isAI: true,
                  });
                }
                return newMessages;
              });
            } else {
              // Final message
              setMessages((prev) => {
                const newMessages = [...prev];
                if (
                  newMessages.length > 0 &&
                  newMessages[newMessages.length - 1].isAI
                ) {
                  newMessages[newMessages.length - 1].content =
                    data.data.message;
                } else {
                  newMessages.push({ content: data.data.message, isAI: true });
                }
                return newMessages;
              });
              currentAIMessageRef.current = "";
              setIsProcessing(false);
            }
          }
        } else if (data.type === "updateGraph") {
          console.log("HEY THERE", data.data.newGraphData);
          setGraphData(data.data.newGraphData);
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
    console.log("received new graphdata", newGraphData);
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
