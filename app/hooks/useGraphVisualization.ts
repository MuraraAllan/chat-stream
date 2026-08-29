import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { NodeData } from "~/types/graph";
import { useSharedState } from "~/context/SharedStateContextServerless";

export function useGraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { graphData, updateGraphData } = useSharedState();
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const nodes = useMemo(() => {
    if (!graphData || !Array.isArray(graphData) || graphData.length === 0)
      return [];

    const sizeFactor = 3.5;
    const padding = 100;

    const pack = d3
      .pack<NodeData>()
      .size([dimensions.width * sizeFactor, dimensions.height * sizeFactor])
      .padding(padding);

    const root = d3
      .hierarchy({ children: graphData })
      .sum((d) => d.value || 300)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packedNodes = pack(root).descendants().slice(1);

    const distributeChildNodes = (node) => {
      if (node.children && node.children.length > 1) {
        const childCount = node.children.length;
        const gridSize = Math.ceil(Math.sqrt(childCount));
        const cellSize = (node.r * 2) / gridSize;

        node.children.forEach((child, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;

          const baseX = node.x - node.r + (col + 0.5) * cellSize;
          const baseY = node.y - node.r + (row + 0.5) * cellSize;

          const randomOffsetX = (Math.random() - 0.5) * cellSize * 0.5;
          const randomOffsetY = (Math.random() - 0.5) * cellSize * 0.5;

          child.x = baseX + randomOffsetX;
          child.y = baseY + randomOffsetY;

          const distance = Math.sqrt(
            Math.pow(child.x - node.x, 2) + Math.pow(child.y - node.y, 2)
          );
          if (distance + child.r > node.r) {
            const angle = Math.atan2(child.y - node.y, child.x - node.x);
            child.x = node.x + (node.r - child.r - 2) * Math.cos(angle);
            child.y = node.y + (node.r - child.r - 2) * Math.sin(angle);
          }
        });
      }
    };

    packedNodes.forEach((node) => {
      if (node.depth === 1) {
        distributeChildNodes(node);
      }
    });

    return packedNodes;
  }, [graphData, dimensions.width, dimensions.height]);

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", (event) => {
      if (svgRef.current) {
        d3.select(svgRef.current.firstChild as SVGGElement).attr(
          "transform",
          event.transform
        );
      }
    });

  const toggleSelectedNode = useCallback(
    (node: d3.HierarchyNode<NodeData> | null) => {
      if (node && Array.isArray(graphData)) {
        const currentNodeData = graphData.find(
          (n) => n.name === node.data.name
        );
        const updatedActiveNodes = currentNodeData?.activeNodes || [];
        const newActiveNodes = updatedActiveNodes.includes(node.data.name)
          ? updatedActiveNodes.filter((name) => name !== node.data.name)
          : [...updatedActiveNodes, node.data.name];

        updateGraphData(newActiveNodes);
      }
    },
    [graphData, updateGraphData]
  );

  const activeNodes = useMemo(() => {
    if (Array.isArray(graphData)) {
      return new Set(graphData.flatMap((n) => n.activeNodes || []));
    }
    return new Set();
  }, [graphData]);

  return {
    svgRef,
    nodes,
    toggleSelectedNode,
    dimensions,
    activeNodes,
    zoom,
  };
}
