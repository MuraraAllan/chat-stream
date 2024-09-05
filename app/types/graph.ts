export interface NodeData {
  name: string;
  description: string;
  children?: NodeData[];
  activeNodes?: string[]; // Add this line
}
