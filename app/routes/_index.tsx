import type { MetaFunction } from "@remix-run/node";
import ChatScreen from "~/components/ChatScreen";
import GraphVisualization from "~/components/GraphVisualization";
import { SharedStateProvider } from "~/context/SharedStateContextServerless";
import { NodeData } from "~/types/graph";
import mergedGraph from "~/data/graph";

export const meta: MetaFunction = () => {
  return [
    { title: "AI Chat with Graph Visualization" },
    {
      name: "description",
      content: "Chat with AI and explore graph visualization",
    },
  ];
};

function convertGraph(inputGraph) {
  function processNode(nodeName, nodeData) {
    const node = {
      name: nodeName,
      description: Array.isArray(nodeData)
        ? nodeData[0]
        : "No description available.",
      children: [],
    };

    if (Array.isArray(nodeData)) {
      nodeData.forEach((item) => {
        if (typeof item === "string" && item !== nodeName) {
          node.children.push({
            name: item,
            description: `Related to ${nodeName}`,
            children: [],
          });
        }
      });
    } else if (typeof nodeData === "object") {
      Object.entries(nodeData).forEach(([key, value]) => {
        if (key !== nodeName) {
          const childNode = processNode(key, value);
          node.children.push(childNode);
        }
      });
    }

    return node;
  }

  return Object.entries(inputGraph).map(([key, value]) =>
    processNode(key, value)
  );
}

const initialGraphData: NodeData = convertGraph(mergedGraph);

// console.log("merged graph is", initialGraphData);
export default function Index() {
  return (
    <SharedStateProvider initialGraphData={initialGraphData}>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-grow">
          <GraphVisualization />
        </div>
        <div className="w-2/4 min-w-[300px] max-w-md border-l border-gray-200">
          <ChatScreen />
        </div>
      </div>
    </SharedStateProvider>
  );
}
