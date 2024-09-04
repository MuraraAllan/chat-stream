import type { MetaFunction } from "@remix-run/node";
import GraphVisualization from "~/components/GraphVisualization";

export const meta: MetaFunction = () => {
  return [
    { title: "Graph Visualization" },
    { name: "description", content: "Circle Packing Graph Visualization" },
  ];
};

export default function Graph() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <GraphVisualization />
    </div>
  );
}
