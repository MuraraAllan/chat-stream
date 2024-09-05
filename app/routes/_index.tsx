import type { MetaFunction } from "@remix-run/node";
import ChatScreen from "~/components/ChatScreen";
import GraphVisualization from "~/components/GraphVisualization";
import { SharedStateProvider } from "~/context/SharedStateContext";
import { NodeData } from "~/types/graph";

export const meta: MetaFunction = () => {
  return [
    { title: "AI Chat with Graph Visualization" },
    {
      name: "description",
      content: "Chat with AI and explore graph visualization",
    },
  ];
};

const initialGraphData: NodeData = {
  name: "Allan Murara",
  description:
    "Full Stack Developer passionate about creating efficient and user-friendly applications.",
  children: [
    {
      name: "Location",
      description:
        "Based in Jaraguá do Sul, Santa Catarina, Brazil. A city known for its industrial heritage and beautiful landscapes.",
      children: [
        {
          name: "Jaraguá do Sul, SC, Brazil",
          description:
            "A city in southern Brazil, known for its German heritage and industrial economy.",
        },
      ],
    },
    {
      name: "Education",
      description:
        "Continuous learner with a focus on modern web technologies and best practices.",
      children: [
        {
          name: "Testing Javascript",
          description:
            "Comprehensive course on JavaScript testing methodologies and tools.",
        },
        {
          name: "Full Stack Dev",
          description:
            "In-depth study of full stack development, covering both front-end and back-end technologies.",
        },
        {
          name: "Computer Networks",
          description:
            "Study of computer networking principles, protocols, and architectures.",
        },
      ],
    },
    {
      name: "Skills",
      description:
        "A diverse set of technical skills covering various aspects of software development.",
      children: [
        {
          name: "FullStack",
          description:
            "Proficient in both front-end and back-end development, creating end-to-end solutions.",
        },
        {
          name: "Data Design",
          description:
            "Experienced in designing efficient and scalable data structures and databases.",
        },
        {
          name: "Project Management",
          description:
            "Skilled in managing software development projects, from planning to delivery.",
        },
      ],
    },
    {
      name: "Experience",
      description:
        "Professional experience in software development and research.",
      children: [
        {
          name: "Student / Research, LabX",
          description:
            "Conducted research and development in cutting-edge technologies at LabX.",
        },
      ],
    },
  ],
};

export default function Index() {
  return (
    <SharedStateProvider initialGraphData={initialGraphData}>
      <div className="flex h-screen overflow-hidden">
        <div className="flex-grow">
          <GraphVisualization />
        </div>
        <div className="w-2/4 min-w-[300px] max-w-md border-l border-gray-200">
          <ChatScreen />
        </div>
      </div>
    </SharedStateProvider>
  );
}
