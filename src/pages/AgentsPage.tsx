
import { AgentList } from "@/components/AgentList";
import { useTranslation } from "react-i18next";
import { Bot } from "lucide-react";

const AgentsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Modern Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('agents.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('agents.subtitle')}</p>
        </div>
      </div>
      <AgentList />
    </div>
  );
};

export default AgentsPage;
