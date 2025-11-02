
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

const DesignerPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          {t('designer.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('designer.subtitle')}</p>
      </div>
      <AdvancedChatPreview />
    </div>
  );
};

export default DesignerPage;
