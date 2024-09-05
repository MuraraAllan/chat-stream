import { useRef, useMemo } from "react";
import * as d3 from "d3";
import { NodeData } from "~/types/graph";
import { useSharedState } from "~/context/SharedStateContext";

export function useGraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { graphData, updateGraphData } = useSharedState();

  const dimensions = useMemo(
    () => ({
      width: 932 * 0.7,
      height: 932 * 0.7,
    }),
    []
  );

  const nodes = useMemo(() => {
    if (!graphData) return [];

    const pack = d3
      .pack<NodeData>()
      .size([dimensions.width - 2, dimensions.height - 2])
      .padding(3);

    const root = d3
      .hierarchy<NodeData>(graphData)
      .sum(() => 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    return pack(root).descendants();
  }, [graphData, dimensions.width, dimensions.height]);

  const toggleSelectedNode = (node: d3.HierarchyNode<NodeData> | null) => {
    if (node) {
      const isNodeAlreadySelected = graphData.activeNodes?.includes(
        node.data.name
      );

      const updatedActiveNodes = isNodeAlreadySelected
        ? graphData.activeNodes?.filter((name) => name !== node.data.name) || []
        : [...new Set([...(graphData.activeNodes || []), node.data.name])];

      const updatedGraphData = {
        ...graphData,
        activeNodes: updatedActiveNodes,
      };

      updateGraphData(updatedGraphData);
    }
  };

  console.log("useGraphVisualization - graphData:", graphData);
  console.log("useGraphVisualization - nodes:", nodes);

  return {
    svgRef,
    nodes,
    toggleSelectedNode,
    dimensions,
    activeNodes: new Set(graphData.activeNodes || []),
  };
}
