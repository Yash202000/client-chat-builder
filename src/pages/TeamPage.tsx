
import { TeamManagement } from "@/components/TeamManagement";
import { useI18n } from '@/hooks/useI18n';
import { Users } from "lucide-react";

const TeamPage = () => {
  const { t, isRTL } = useI18n();

  return (
    <div className="space-y-6 p-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl shadow-blue-500/25">
            <Users className="h-8 w-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {t('team.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mt-1">{t('team.subtitle')}</p>
        </div>
      </div>
      <TeamManagement />
    </div>
  );
};

export default TeamPage;
