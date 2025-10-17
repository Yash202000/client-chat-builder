
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";

const DesignerPage = () => {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          Widget Designer
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Customize appearance and generate embed codes for your chat widget</p>
      </div>
      <AdvancedChatPreview />
    </div>
  );
};

export default DesignerPage;
