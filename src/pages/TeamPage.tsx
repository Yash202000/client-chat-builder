
import { TeamManagement } from "@/components/TeamManagement";
import { useI18n } from '@/hooks/useI18n';

const TeamPage = () => {
  const { t, isRTL } = useI18n();

  return (
    <div className="space-y-6 p-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          {t('team.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('team.subtitle')}</p>
      </div>
      <TeamManagement />
    </div>
  );
};

export default TeamPage;
