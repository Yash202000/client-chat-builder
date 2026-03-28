import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

interface LanguageTexts {
  welcome_message: string;
  header_title: string;
  input_placeholder: string;
  proactive_message: string;
}

interface LanguageManagerProps {
  languages: Record<string, LanguageTexts>;
  defaultLanguage: string;
  onLanguagesChange: (languages: Record<string, LanguageTexts>) => void;
  onDefaultLanguageChange: (lang: string) => void;
}

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'ar', name: 'العربية (Arabic)', rtl: true },
  { code: 'es', name: 'Español (Spanish)', rtl: false },
  { code: 'fr', name: 'Français (French)', rtl: false },
  { code: 'de', name: 'Deutsch (German)', rtl: false },
  { code: 'pt', name: 'Português (Portuguese)', rtl: false },
  { code: 'ru', name: 'Русский (Russian)', rtl: false },
  { code: 'zh', name: '中文 (Chinese)', rtl: false },
  { code: 'ja', name: '日本語 (Japanese)', rtl: false },
  { code: 'ko', name: '한국어 (Korean)', rtl: false },
  { code: 'hi', name: 'हिन्दी (Hindi)', rtl: false },
  { code: 'he', name: 'עברית (Hebrew)', rtl: true },
  { code: 'fa', name: 'فارسی (Persian)', rtl: true },
  { code: 'ur', name: 'اردو (Urdu)', rtl: true },
  { code: 'tr', name: 'Türkçe (Turkish)', rtl: false },
  { code: 'it', name: 'Italiano (Italian)', rtl: false },
  { code: 'nl', name: 'Nederlands (Dutch)', rtl: false },
  { code: 'pl', name: 'Polski (Polish)', rtl: false },
];

const DEFAULT_TEXTS: LanguageTexts = {
  welcome_message: "Hi! How can I help you today?",
  header_title: "Customer Support",
  input_placeholder: "Type a message...",
  proactive_message: "Hello! Do you have any questions?",
};

export const LanguageManager: React.FC<LanguageManagerProps> = ({
  languages,
  defaultLanguage,
  onLanguagesChange,
  onDefaultLanguageChange,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage || 'en');
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  const activeLanguages = Object.keys(languages);
  const availableToAdd = AVAILABLE_LANGUAGES.filter(lang => !activeLanguages.includes(lang.code));

  const handleAddLanguage = (langCode: string) => {
    const newLanguages = { ...languages, [langCode]: DEFAULT_TEXTS };
    onLanguagesChange(newLanguages);
    setSelectedLanguage(langCode);
    setShowAddLanguage(false);
  };

  const handleRemoveLanguage = (langCode: string) => {
    if (activeLanguages.length === 1) {
      alert(t('designer.cannotRemoveLastLanguage'));
      return;
    }
    const newLanguages = { ...languages };
    delete newLanguages[langCode];
    onLanguagesChange(newLanguages);

    // If removed language was default or selected, switch to first available
    const remainingLangs = Object.keys(newLanguages);
    if (langCode === defaultLanguage) {
      onDefaultLanguageChange(remainingLangs[0]);
    }
    if (langCode === selectedLanguage) {
      setSelectedLanguage(remainingLangs[0]);
    }
  };

  const handleTextChange = (langCode: string, field: keyof LanguageTexts, value: string) => {
    const newLanguages = {
      ...languages,
      [langCode]: {
        ...languages[langCode],
        [field]: value,
      },
    };
    onLanguagesChange(newLanguages);
  };

  const getLanguageInfo = (code: string) => {
    return AVAILABLE_LANGUAGES.find(l => l.code === code) || { code, name: code, rtl: false };
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
      {/* Header */}
      <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <Globe className="h-3 w-3 text-white" />
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.multiLanguageSupport')}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {showAddLanguage && availableToAdd.length > 0 && (
            <select
              className="text-xs h-6 px-1.5 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white"
              defaultValue=""
              onChange={(e) => { if (e.target.value) handleAddLanguage(e.target.value); }}
            >
              <option value="" disabled>{t('designer.selectLanguageToAdd')}</option>
              {availableToAdd.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.code} — {lang.name}</option>
              ))}
            </select>
          )}
          <Button
            onClick={() => setShowAddLanguage(!showAddLanguage)}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('designer.addLanguage')}
          </Button>
        </div>
      </div>

      {activeLanguages.length > 0 && (
        <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <TabsList className="w-full flex-wrap h-auto bg-slate-100 dark:bg-slate-900 mb-2 p-0.5 gap-0.5">
            {activeLanguages.map((langCode) => {
              const langInfo = getLanguageInfo(langCode);
              return (
                <TabsTrigger
                  key={langCode}
                  value={langCode}
                  className="h-6 px-2 text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
                >
                  <span className="font-mono">{langCode}</span>
                  {langCode === defaultLanguage && <Check className="h-2.5 w-2.5 ml-1 text-green-600" />}
                  {langInfo.rtl && <span className="ml-1 text-xs opacity-60">RTL</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {activeLanguages.map((langCode) => {
            const langInfo = getLanguageInfo(langCode);
            const texts = languages[langCode];
            return (
              <TabsContent key={langCode} value={langCode} className="mt-0 space-y-1.5">
                {/* Lang actions bar */}
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {langCode === defaultLanguage ? `✓ ${t('designer.defaultLanguage')}` : langInfo.name.split('(')[0].trim()}
                    {langInfo.rtl && <span className="ml-1 opacity-60">(RTL)</span>}
                  </span>
                  <div className="flex gap-1">
                    {langCode !== defaultLanguage && (
                      <Button onClick={() => onDefaultLanguageChange(langCode)} size="sm" variant="outline" className="h-5 px-1.5 text-xs">
                        {t('designer.setAsDefault')}
                      </Button>
                    )}
                    {activeLanguages.length > 1 && (
                      <Button onClick={() => handleRemoveLanguage(langCode)} size="sm" variant="destructive" className="h-5 w-5 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Fields in 2-column grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.headerTitle')}</Label>
                    <Input value={texts.header_title} onChange={(e) => handleTextChange(langCode, 'header_title', e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" dir={langInfo.rtl ? 'rtl' : 'ltr'} />
                  </div>
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.inputPlaceholder')}</Label>
                    <Input value={texts.input_placeholder} onChange={(e) => handleTextChange(langCode, 'input_placeholder', e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" dir={langInfo.rtl ? 'rtl' : 'ltr'} />
                  </div>
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.welcomeMessage')}</Label>
                    <Input value={texts.welcome_message} onChange={(e) => handleTextChange(langCode, 'welcome_message', e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" dir={langInfo.rtl ? 'rtl' : 'ltr'} />
                  </div>
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.proactiveMessage')}</Label>
                    <Input value={texts.proactive_message} onChange={(e) => handleTextChange(langCode, 'proactive_message', e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" dir={langInfo.rtl ? 'rtl' : 'ltr'} />
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {activeLanguages.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <Globe className="h-8 w-8 mx-auto mb-1 opacity-50" />
          <p className="text-xs">{t('designer.noLanguagesAdded')}</p>
          <Button onClick={() => setShowAddLanguage(true)} size="sm" className="mt-2 h-7 text-xs">
            {t('designer.addFirstLanguage')}
          </Button>
        </div>
      )}
    </div>
  );
};
