import * as d3 from "d3";
import styles from "./graph.module.css";
import { useGraphVisualization } from "~/hooks/useGraphVisualization";
import { HierarchyCircularNode } from "d3";
import { NodeData } from "~/types/graph";

export const GraphNodes = () => {
  const {
    nodes,
    toggleSelectedNode: setSelectedNode,
    activeNodes,
  } = useGraphVisualization();
  const color = d3.scaleOrdinal(d3.schemeCategory10); // Changed to a more distinct color scheme

  if (!nodes || nodes.length === 0) {
    console.log("GraphNodes - No nodes to render");
    return null;
  }

  const handleNodeClick = (
    event: React.MouseEvent,
    node: HierarchyCircularNode<NodeData>
  ) => {
    event.stopPropagation();
    setSelectedNode(node);
  };

  return (
    <g>
      {nodes.map((node, index) => {
        const isActive = activeNodes.has(node.data.name);
        const isMainNode = node.depth === 1;
        const nodeColor = isMainNode
          ? "url(#mainNodeGradient)"
          : color(node.depth.toString());

        // Create a unique key using the node's name, position, and index
        const nodeKey = `${node.data.name}-${node.x}-${node.y}-${index}`;

        return (
          <g
            key={nodeKey}
            transform={`translate(${node.x},${node.y})`}
            onClick={(event) => handleNodeClick(event, node)}
            className={`${isActive ? styles["node-glow"] : ""} ${
              styles["node-3d"]
            }`}
            style={{ cursor: "pointer" }}
          >
            <circle
              r={node.r}
              fill={nodeColor}
              fillOpacity={isMainNode ? 0.7 : node.children ? 0.6 : 0.4}
              stroke={
                node.children ? d3.rgb(nodeColor).darker().toString() : "none"
              }
              strokeWidth={3}
            />
            <text
              dy=".35em"
              textAnchor="middle"
              fontSize={node.r > 30 ? "18px" : node.r > 20 ? "14px" : "10px"}
              fontWeight={node.children ? "bold" : "normal"}
              fill={node.children ? "#fff" : "#000"}
              opacity={1} // Changed to always show text
              pointerEvents="none"
            >
              {node.data.name}
            </text>
          </g>
        );
      })}
    </g>
  );
};
