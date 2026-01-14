
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { Palette } from "lucide-react";

const DesignerPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Modern Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
          <Palette className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('designer.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('designer.subtitle')}</p>
        </div>
      </div>
      <AdvancedChatPreview />
    </div>
  );
};

export default DesignerPage;
