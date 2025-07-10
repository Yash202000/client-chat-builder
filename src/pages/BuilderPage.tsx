
import { AgentBuilder } from "@/components/AgentBuilder";

const BuilderPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">
          Agent Builder
        </h2>
        <p className="text-gray-600 mt-1">Design conversation flows with drag-and-drop interface</p>
      </div>
      <AgentBuilder />
    </div>
  );
};

export default BuilderPage;
