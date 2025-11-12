import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="card-shadow-lg bg-white dark:bg-slate-800">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CardTitle className="dark:text-white text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('designer.multiLanguageSupport')}
          </CardTitle>
          <Button
            onClick={() => setShowAddLanguage(!showAddLanguage)}
            size="sm"
            variant="outline"
            className="btn-hover-lift"
          >
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('designer.addLanguage')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {showAddLanguage && availableToAdd.length > 0 && (
          <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold mb-2 dark:text-white">{t('designer.selectLanguageToAdd')}</h4>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableToAdd.map((lang) => (
                <Button
                  key={lang.code}
                  onClick={() => handleAddLanguage(lang.code)}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                >
                  <span className="font-mono mr-2">{lang.code}</span>
                  {lang.name}
                  {lang.rtl && <span className="ml-auto text-xs text-muted-foreground">RTL</span>}
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeLanguages.length > 0 && (
          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <TabsList className="w-full flex-wrap h-auto bg-slate-100 dark:bg-slate-900 mb-4">
              {activeLanguages.map((langCode) => {
                const langInfo = getLanguageInfo(langCode);
                return (
                  <TabsTrigger
                    key={langCode}
                    value={langCode}
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 relative"
                  >
                    <span className="font-mono mr-2">{langCode}</span>
                    {langInfo.name.split('(')[0].trim()}
                    {langCode === defaultLanguage && (
                      <Check className="h-3 w-3 ml-1 text-green-600" />
                    )}
                    {langInfo.rtl && (
                      <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">RTL</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {activeLanguages.map((langCode) => {
              const langInfo = getLanguageInfo(langCode);
              const texts = languages[langCode];

              return (
                <TabsContent key={langCode} value={langCode} className="space-y-4">
                  <div className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <h4 className="font-semibold dark:text-white">
                        {langInfo.name} {langInfo.rtl && <span className="text-xs text-muted-foreground">(RTL)</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        {langCode === defaultLanguage ? t('designer.defaultLanguage') : t('designer.clickToSetDefault')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {langCode !== defaultLanguage && (
                        <Button
                          onClick={() => onDefaultLanguageChange(langCode)}
                          size="sm"
                          variant="outline"
                        >
                          {t('designer.setAsDefault')}
                        </Button>
                      )}
                      {activeLanguages.length > 1 && (
                        <Button
                          onClick={() => handleRemoveLanguage(langCode)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`${langCode}-header`} className="text-xs dark:text-gray-300 mb-1.5 block">
                        {t('designer.headerTitle')}
                      </Label>
                      <Input
                        id={`${langCode}-header`}
                        value={texts.header_title}
                        onChange={(e) => handleTextChange(langCode, 'header_title', e.target.value)}
                        className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        dir={langInfo.rtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${langCode}-welcome`} className="text-xs dark:text-gray-300 mb-1.5 block">
                        {t('designer.welcomeMessage')}
                      </Label>
                      <Input
                        id={`${langCode}-welcome`}
                        value={texts.welcome_message}
                        onChange={(e) => handleTextChange(langCode, 'welcome_message', e.target.value)}
                        className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        dir={langInfo.rtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${langCode}-placeholder`} className="text-xs dark:text-gray-300 mb-1.5 block">
                        {t('designer.inputPlaceholder')}
                      </Label>
                      <Input
                        id={`${langCode}-placeholder`}
                        value={texts.input_placeholder}
                        onChange={(e) => handleTextChange(langCode, 'input_placeholder', e.target.value)}
                        className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        dir={langInfo.rtl ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${langCode}-proactive`} className="text-xs dark:text-gray-300 mb-1.5 block">
                        {t('designer.proactiveMessage')}
                      </Label>
                      <Input
                        id={`${langCode}-proactive`}
                        value={texts.proactive_message}
                        onChange={(e) => handleTextChange(langCode, 'proactive_message', e.target.value)}
                        className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        dir={langInfo.rtl ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {activeLanguages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('designer.noLanguagesAdded')}</p>
            <Button onClick={() => setShowAddLanguage(true)} className="mt-4">
              {t('designer.addFirstLanguage')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
