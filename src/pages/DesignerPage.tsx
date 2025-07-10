
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";

const DesignerPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-900 to-red-900 bg-clip-text text-transparent">
          Widget Designer
        </h2>
        <p className="text-gray-600 mt-1">Customize appearance and generate embed codes</p>
      </div>
      <AdvancedChatPreview />
    </div>
  );
};

export default DesignerPage;
