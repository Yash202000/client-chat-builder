
import { TeamManagement } from "@/components/TeamManagement";
import { useI18n } from '@/hooks/useI18n';
import { Users } from "lucide-react";

const TeamPage = () => {
  const { t, isRTL } = useI18n();

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center gap-3 sm:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="relative shrink-0">
          <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl shadow-blue-500/25">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {t('team.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg mt-0.5 sm:mt-1">{t('team.subtitle')}</p>
        </div>
      </div>
      <TeamManagement />
    </div>
  );
};

export default TeamPage;
