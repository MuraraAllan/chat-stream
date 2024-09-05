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
  const color = d3.scaleOrdinal(d3.schemeSet3);

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
      {nodes.map((node) => {
        const isActive = activeNodes.has(node.data.name);
        const isMainNode = node.depth === 0;
        const nodeColor = isMainNode
          ? "url(#mainNodeGradient)"
          : color(node.depth.toString());

        return (
          <g
            key={node.data.name}
            transform={`translate(${node.x},${node.y})`}
            onClick={(event) => handleNodeClick(event, node)}
            className={isActive ? styles["node-glow"] : ""}
            style={{ cursor: "pointer" }}
          >
            <circle
              r={node.r}
              fill={nodeColor}
              fillOpacity={isMainNode ? 0.5 : node.children ? 0.6 : 0.4}
              stroke={
                node.children ? d3.rgb(nodeColor).darker().toString() : "none"
              }
              strokeWidth={2}
            />
            <text
              dy=".35em"
              textAnchor="middle"
              fontSize={node.r > 20 ? "15px" : "10px"}
              fontWeight={node.children ? "bold" : "normal"}
              fill={node.children ? "#fff" : "#000"}
              opacity={node.r > 10 ? 1 : 0}
              pointerEvents="none"
            >
              {node.data.name.split(/\s+/).map((word, i) => (
                <tspan key={i} x={0} dy={i ? "1.2em" : "-0.6em"}>
                  {word}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
};
