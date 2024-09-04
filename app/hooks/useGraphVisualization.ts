import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { NodeData } from "~/types/graph";

export function useGraphVisualization(graphData: NodeData) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<d3.HierarchyCircularNode<NodeData>[]>([]);
  const [selectedNode, setSelectedNode] =
    useState<d3.HierarchyNode<NodeData> | null>(null);

  const dimensions = useMemo(() => {
    const width = 932 * 0.7;
    const height = 932 * 0.7;
    return { width, height };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const pack = d3
      .pack<NodeData>()
      .size([dimensions.width - 2, dimensions.height - 2])
      .padding(3);

    const root = d3
      .hierarchy<NodeData>(graphData)
      .sum(() => 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packedNodes = pack(root).descendants();
    setNodes(packedNodes);
  }, [graphData, dimensions]);

  return { svgRef, nodes, selectedNode, setSelectedNode, dimensions };
}
