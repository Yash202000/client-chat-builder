import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { useSearchParams } from "react-router-dom";

const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");

  return (
    <div className="animate-fade-in">
      <AdvancedChatPreview selectedAgentId={agentId ? parseInt(agentId) : undefined} />
    </div>
  );
};

export default DesignerPage;
