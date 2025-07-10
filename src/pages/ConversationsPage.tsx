
import { ConversationManager } from "@/components/ConversationManager";

const ConversationsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">
          Live Conversations
        </h2>
        <p className="text-gray-600 mt-1">Manage customer conversations in real-time with advanced features</p>
      </div>
      <ConversationManager />
    </div>
  );
};

export default ConversationsPage;
