import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { NodeData } from "~/types/graph";

type Message = {
  content: string;
  isAI: boolean;
};

interface SharedStateContextType {
  messages: Message[];
  isProcessing: boolean;
  sendMessage: (message: string) => Promise<void>;
  graphData: NodeData[];
  updateGraphData: (activeNodes: string[]) => void;
}

const SharedStateContext = createContext<SharedStateContextType | undefined>(
  undefined
);

export const SharedStateProvider: React.FC<{
  children: React.ReactNode;
  initialGraphData: NodeData[];
}> = ({ children, initialGraphData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentAIMessageRef = useRef("");
  const [graphData, setGraphData] = useState<NodeData[]>(initialGraphData);

  const updateGraphData = useCallback((activeNodes: string[]) => {
    setGraphData((prevGraphData) => {
      return prevGraphData.map((node) => ({
        ...node,
        activeNodes: activeNodes.includes(node.name) ? activeNodes : undefined,
      }));
    });
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (message.trim() === "") return;

    setMessages((prev) => [...prev, { content: message, isAI: false }]);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("message", message);

      const response = await fetch("/chat/message", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        console.log("found an unlocked stream.", reader);
        await processStreamResponse(reader);
      } else {
        throw new Error("Failed to get reader from response");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsProcessing(false);
    }
  }, []);

  const processStreamResponse = useCallback(
    (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const decoder = new TextDecoder();
      return new Promise<void>((resolve, reject) => {
        function processText({
          done,
          value,
        }: ReadableStreamReadResult<Uint8Array>): void {
          if (done) {
            setIsProcessing(false);
            resolve();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          lines.forEach((line) => {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(5));
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
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        if (
                          newMessages.length > 0 &&
                          newMessages[newMessages.length - 1].isAI
                        ) {
                          newMessages[newMessages.length - 1].content =
                            data.data.message;
                        } else {
                          newMessages.push({
                            content: data.data.message,
                            isAI: true,
                          });
                        }
                        return newMessages;
                      });
                      currentAIMessageRef.current = "";
                    }
                  }
                } else if (data.type === "updateGraph") {
                  updateGraphData(data.data.activeNodes);
                }
              } catch (error) {
                console.error("Error parsing SSE message:", error);
              }
            }
          });

          reader.read().then(processText).catch(reject);
        }

        reader.read().then(processText).catch(reject);
      });
    },
    [updateGraphData]
  );

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
              setMessages((prev) => {
                const newMessages = [...prev];
                if (
                  newMessages.length > 0 &&
                  newMessages[newMessages.length - 1].isAI
                ) {
                  newMessages[newMessages.length - 1].content =
                    data.data.message;
                } else {
                  newMessages.push({
                    content: data.data.message,
                    isAI: true,
                  });
                }
                return newMessages;
              });
              currentAIMessageRef.current = "";
            }
          }
        } else if (data.type === "updateGraph") {
          updateGraphData(data.data.activeNodes);
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
  }, [updateGraphData]);

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
