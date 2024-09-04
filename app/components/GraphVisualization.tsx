import { useCallback } from "react";
import { useSharedState } from "~/context/SharedStateContext";
import { useGraphVisualization } from "~/hooks/useGraphVisualization";
import { GraphNodes } from "./GraphNodes";
import { NodeData } from "~/types/graph";
import * as d3 from "d3";

export default function GraphVisualization() {
  const { graphData } = useSharedState();
  const { svgRef, nodes, selectedNode, setSelectedNode, dimensions } =
    useGraphVisualization(graphData);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const renderNodeContent = (node: d3.HierarchyNode<NodeData>) => {
    return (
      <div key={node.data.name}>
        <h3
          style={{ fontSize: "20px", marginTop: "15px", marginBottom: "10px" }}
        >
          {node.data.name}
        </h3>
        <p style={{ fontSize: "14px", marginBottom: "10px" }}>
          {node.data.description}
        </p>
        {node.children && (
          <div style={{ marginLeft: "20px" }}>
            {node.children.map((child) => renderNodeContent(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "652px",
          maxHeight: "652px",
        }}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        onClick={handleCloseDetail}
      >
        <GraphNodes nodes={nodes} onNodeClick={setSelectedNode} />
      </svg>
      {selectedNode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            overflow: "auto",
          }}
        >
          <button
            onClick={handleCloseDetail}
            aria-label="Close details"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
          {renderNodeContent(selectedNode)}
        </div>
      )}
    </div>
  );
}
