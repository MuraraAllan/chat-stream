import React from "react";
import { useGraphVisualization } from "~/hooks/useGraphVisualization";
import { GraphNodes } from "./graph.client/GraphNodes";
import { GraphFilters } from "./graph.client/GraphFilters";
import { NodeDetail } from "./graph.client/NodeDetail";

export default function GraphVisualization() {
  const { svgRef, dimensions } = useGraphVisualization();

  if (!dimensions) {
    return <div>Loading graph...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-3/4 relative">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <GraphFilters />
          <GraphNodes />
        </svg>
      </div>
      <div className="w-1/4 bg-white bg-opacity-90 p-4 overflow-y-auto">
        <NodeDetail />
      </div>
    </div>
  );
}
