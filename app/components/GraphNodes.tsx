import React from "react";
import * as d3 from "d3";
import { NodeData } from "~/types/graph";

interface GraphNodesProps {
  nodes: d3.HierarchyCircularNode<NodeData>[];
  onNodeClick: (node: d3.HierarchyNode<NodeData>) => void;
}

export function GraphNodes({ nodes, onNodeClick }: GraphNodesProps) {
  const color = d3.scaleOrdinal(d3.schemeSet3);

  return (
    <g>
      {nodes.map((node) => (
        <g
          key={node.data.name}
          transform={`translate(${node.x},${node.y})`}
          onClick={(event) => {
            event.stopPropagation();
            onNodeClick(node);
          }}
        >
          <circle
            r={node.r}
            fill={color(node.depth.toString())}
            fillOpacity={node.children ? 0.6 : 0.4}
            stroke={
              node.children
                ? d3.rgb(color(node.depth.toString())).darker().toString()
                : "none"
            }
            strokeWidth={2}
          />
          <text
            dy=".35em"
            textAnchor="middle"
            fontSize="15px"
            fontWeight={node.children ? "bold" : "normal"}
            fill={node.children ? "#fff" : "#000"}
            opacity={node.r > 20 ? 1 : 0}
          >
            {node.data.name.split(/\s+/).map((word, i) => (
              <tspan key={i} x={0} dy={i ? "1.2em" : "-0.6em"}>
                {word}
              </tspan>
            ))}
          </text>
        </g>
      ))}
    </g>
  );
}
