import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { useSearchParams } from "react-router-dom";

const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");

  return (
    <div className="h-[calc(100vh-4rem)] p-5 overflow-hidden">
      <AdvancedChatPreview selectedAgentId={agentId ? parseInt(agentId) : undefined} />
    </div>
  );
};

export default DesignerPage;
