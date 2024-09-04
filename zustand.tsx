Certainly! Refactoring to use ZustVand instead of React Context is a great idea for state management. Zustand is lightweight, has a simple API, and works well with React. Here's a plan to refactor our current setup to use Zustand:

1. Install Zustand
   - Add Zustand to the project dependencies

2. Create a Zustand store
   - Define the store state and actions
   - Implement the event source logic within the store

3. Refactor ChatEventListenerContext
   - Remove the context and replace it with a custom hook that uses the Zustand store

4. Update ChatScreen component
   - Use the Zustand store instead of the context

5. Update GraphVisualization component
   - Integrate with the Zustand store for graph data updates

6. Modify _index.tsx
   - Remove the context provider
   - Use the Zustand store for initial state setup if needed

Here's a more detailed breakdown of each step:

1. Install Zustand:
```bash
npm install zustand
```

2. Create a Zustand store (new file `app/store/chatStore.ts`):

```typescript
import create from 'zustand';
import { NodeData } from '~/types/graph';

type Message = {
  content: string;
  isAI: boolean;
};

type ChatStore = {
  messages: Message[];
  isProcessing: boolean;
  graphData: NodeData;
  sendMessage: (message: string) => void;
  updateGraphData: (newGraphData: NodeData) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isProcessing: false,
  graphData: {} as NodeData, // Initialize with your default graph data

  sendMessage: (message: string) => {
    set((state) => ({
      messages: [...state.messages, { content: message, isAI: false }],
      isProcessing: true,
    }));
    // Implement server communication here
  },

  updateGraphData: (newGraphData: NodeData) => {
    set({ graphData: newGraphData });
    // Implement any necessary server updates here
  },
}));

// Initialize event source
if (typeof window !== 'undefined') {
  const eventSource = new EventSource('/retrieveChat');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        if (data.data.isAI) {
          useChatStore.setState((state) => {
            const newMessages = state.messages.filter((msg, index, array) => {
              if (!msg.isAI) return true;
              return index < array.length - 1 || !array[array.length - 1].isAI;
            });

            newMessages.push({ content: data.data.message, isAI: true });
            return {
              messages: newMessages,
              isProcessing: data.data.isPartial !== false,
            };
          });
        }
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    eventSource.close();
  };
}
```

3. Remove ChatEventListenerContext (delete the file)

4. Update ChatScreen component:

```tsx
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useChatStore } from "~/store/chatStore";

// ... (keep CodeBlock component)

export default function ChatScreen() {
  const { messages, isProcessing, sendMessage } = useChatStore();
  const [inputMessage, setInputMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ... (keep scrollToBottom and useEffect)

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  // ... (keep formatMessage)

  return (
    // ... (keep the existing JSX, just update the state references)
  );
}
```

5. Update GraphVisualization component:

```tsx
import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { useChatStore } from "~/store/chatStore";

// ... (keep existing imports and types)

const GraphVisualization: React.FC = () => {
  const { graphData, updateGraphData } = useChatStore();

  // ... (keep existing component logic)

  useEffect(() => {
    // ... (existing D3 logic)

    // Update click handler to use updateGraphData
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
      // Implement graph modification logic here if needed
      // Then call updateGraphData with the new data
      // updateGraphData(newGraphData);
    });

    // ... (rest of the D3 logic)
  }, [graphData, updateGraphData]);

  // ... (rest of the component remains the same)
};

export default GraphVisualization;
```

6. Modify _index.tsx:

```tsx
import { useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import ChatScreen from "~/components/chatScreen";
import GraphVisualization from "~/components/GraphVisualization";
import { useChatStore } from "~/store/chatStore";

export const meta: MetaFunction = () => {
  // ... (keep existing meta)
};

const initialGraphData = {
  // ... (keep your initial graph data)
};

export default function Index() {
  const { updateGraphData } = useChatStore();

  useEffect(() => {
    updateGraphData(initialGraphData);
  }, [updateGraphData]);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="w-full md:w-7/10 h-1/2 md:h-full overflow-hidden flex items-center justify-center">
        <GraphVisualization />
      </div>
      <div className="w-full md:w-3/10 h-1/2 md:h-full overflow-hidden">
        <ChatScreen />
      </div>
    </div>
  );
}
```
