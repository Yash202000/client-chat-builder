import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pcm', name: 'Nigerian Pidgin', nativeName: 'Naija' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${
              i18n.language === language.code ? 'bg-accent' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{language.nativeName}</span>
              {i18n.language === language.code && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
