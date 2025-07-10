
import { AgentList } from "@/components/AgentList";

const AgentsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">
          Your AI Agents
        </h2>
        <p className="text-gray-600 mt-1">Create and manage intelligent chat agents for your clients</p>
      </div>
      <AgentList />
    </div>
  );
};

export default AgentsPage;
