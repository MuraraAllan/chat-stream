import { useGraphVisualization } from "~/hooks/useGraphVisualization";

export const NodeDetail = () => {
  const { nodes, toggleSelectedNode, activeNodes } = useGraphVisualization();

  const selectedNodes = nodes.filter((node) => activeNodes.has(node.data.name));

  if (selectedNodes.length === 0) {
    return <div className="text-gray-500">No nodes selected</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Selected Nodes</h2>
      {selectedNodes.map((node) => (
        <div key={node.data.name} className="mb-4 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold">{node.data.name}</h3>
            <button
              onClick={() => toggleSelectedNode(node)}
              className="text-sm bg-red-500 text-white px-2 py-1 rounded"
            >
              Remove
            </button>
          </div>
          <p className="text-sm">{node.data.description}</p>
          {node.children && (
            <div className="mt-2">
              <h4 className="text-md font-semibold">Related:</h4>
              <ul className="list-disc pl-5">
                {node.children.map((child) => (
                  <li key={child.data.name} className="text-sm">
                    {child.data.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
