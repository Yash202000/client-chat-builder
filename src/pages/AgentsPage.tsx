
import { AgentList } from "@/components/AgentList";

const AgentsPage = () => {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Your AI Agents
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Create and manage intelligent chat agents for your clients</p>
      </div>
      <AgentList />
    </div>
  );
};

export default AgentsPage;
