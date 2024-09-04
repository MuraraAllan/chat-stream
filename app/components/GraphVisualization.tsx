import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";

interface NodeData {
  name: string;
  children?: NodeData[];
  description?: string;
}

interface GraphVisualizationProps {
  graphData: NodeData;
  onStateChange: (newState: NodeData) => void;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graphData,
  onStateChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] =
    useState<d3.HierarchyNode<NodeData> | null>(null);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 932 * 0.7;
    const height = 932 * 0.7;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    svg.selectAll("*").remove();

    const pack = d3
      .pack<NodeData>()
      .size([width - 2, height - 2])
      .padding(3);

    const root = d3
      .hierarchy<NodeData>(graphData)
      .sum(() => 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const nodes = pack(root);

    const color = d3.scaleOrdinal(d3.schemeSet3);

    const g = svg.append("g").attr("transform", `translate(1,1)`);

    const node = g
      .selectAll("g")
      .data(nodes.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        // Implement graph modification logic here if needed
        // Then call onStateChange with the new data
      });

    node
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => color(d.depth.toString()))
      .attr("fill-opacity", (d) => (d.children ? 0.6 : 0.4))
      .attr("stroke", (d) =>
        d.children
          ? d3.rgb(color(d.depth.toString())).darker().toString()
          : "none"
      )
      .attr("stroke-width", 2);

    // const fontSize = (d: d3.HierarchyCircularNode<NodeData>) =>
    // `${Math.min((2 * d.r) / d.data.name.length, d.r / 3)}px`;

    const fontSize = (d: d3.HierarchyCircularNode<NodeData>) => `15px`;
    node
      .append("text")
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", fontSize)
      .style("font-weight", (d) => (d.children ? "bold" : "normal"))
      .style("fill", (d) => (d.children ? "#fff" : "#000"))
      .text((d) => d.data.name)
      .attr("opacity", (d) => (d.r > 20 ? 1 : 0))
      .each(function (d) {
        const self = d3.select(this);
        const words = d.data.name.split(/\s+/);
        if (words.length > 1) {
          self.text("");
          words.forEach((word, i) => {
            self
              .append("tspan")
              .attr("x", 0)
              .attr("dy", i ? "1.2em" : "-0.6em")
              .text(word);
          });
        }
      });

    svg.on("click", handleCloseDetail);
  }, [graphData, onStateChange, handleCloseDetail]);

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
      />
      {selectedNode && (
        <div
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
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
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCloseDetail();
            }
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
};

export default GraphVisualization;
