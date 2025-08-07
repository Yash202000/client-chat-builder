import { VaultSettings } from "@/components/VaultSettings";

const VaultPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-teal-900 bg-clip-text text-transparent">
          API Key Vault
        </h2>
        <p className="text-gray-600 mt-1">Manage your API credentials for various AI platforms</p>
      </div>
      <VaultSettings />
    </div>
  );
};

export default VaultPage;
