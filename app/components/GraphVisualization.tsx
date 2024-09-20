import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useGraphVisualization } from "~/hooks/useGraphVisualization";
import { GraphNodes } from "./graph.client/GraphNodes";
import { GraphFilters } from "./graph.client/GraphFilters";

export default function GraphVisualization() {
  const { svgRef, dimensions, zoom, nodes } = useGraphVisualization();
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (svgRef.current && gRef.current && nodes.length > 0) {
      const svg = d3.select(svgRef.current);
      const g = d3.select(gRef.current);

      svg.call(zoom as any);
      zoom.on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

      // Calculate the bounding box of all nodes
      const bounds = {
        left: d3.min(nodes, (d) => d.x - d.r) || 0,
        right: d3.max(nodes, (d) => d.x + d.r) || 0,
        top: d3.min(nodes, (d) => d.y - d.r) || 0,
        bottom: d3.max(nodes, (d) => d.y + d.r) || 0,
      };

      const graphWidth = bounds.right - bounds.left;
      const graphHeight = bounds.bottom - bounds.top;

      // Calculate the scale to fit the graph
      const baseScale = Math.min(
        dimensions.width / graphWidth,
        dimensions.height / graphHeight
      );

      // Apply a zoom factor to focus more on the center
      const zoomFactor = 2.5; // Adjust this value to zoom in more or less
      const scale = baseScale * zoomFactor;

      // Calculate the transform to center the graph and apply zoom
      const transform = d3.zoomIdentity
        .translate(
          dimensions.width / 2 - (bounds.left + graphWidth / 2) * scale,
          dimensions.height / 2 - (bounds.top + graphHeight / 2) * scale
        )
        .scale(scale);

      // Apply the transform
      svg.call(zoom.transform, transform);
    }
  }, [zoom, dimensions, nodes]);

  if (!dimensions) {
    return <div>Loading graph...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-full relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <GraphFilters />
          <g ref={gRef}>
            <GraphNodes />
          </g>
        </svg>
      </div>
    </div>
  );
}
