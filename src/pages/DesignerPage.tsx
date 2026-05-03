import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { useSearchParams } from "react-router-dom";

const DesignerPage = () => {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("agentId");

  return (
    <div className="h-[calc(100vh-4rem)] px-4 sm:px-5 py-3 sm:py-5 overflow-y-auto lg:overflow-hidden">
      <AdvancedChatPreview selectedAgentId={agentId ? parseInt(agentId) : undefined} />
    </div>
  );
};

export default DesignerPage;
