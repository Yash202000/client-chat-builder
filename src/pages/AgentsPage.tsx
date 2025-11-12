
import { AgentList } from "@/components/AgentList";
import { useTranslation } from "react-i18next";

const AgentsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          {t('agents.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('agents.subtitle')}</p>
      </div>
      <AgentList />
    </div>
  );
};

export default AgentsPage;
