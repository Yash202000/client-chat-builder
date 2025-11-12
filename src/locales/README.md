# Internationalization (i18n) Guide

This project uses **react-i18next** for internationalization and supports multiple languages including RTL (Right-to-Left) languages like Arabic.

## 🌍 Supported Languages

- **English (en)** - Default language
- **Arabic (ar)** - RTL support enabled

## 📁 File Structure

```
src/locales/
├── i18n.ts                    # i18n configuration
├── en/
│   └── translation.json       # English translations
├── ar/
│   └── translation.json       # Arabic translations
└── README.md                  # This file
```

## 🚀 Quick Start

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('agents.title')}</p>
    </div>
  );
};
```

### Using the Custom Hook

```tsx
import { useI18n } from '@/hooks/useI18n';

const MyComponent = () => {
  const { t, isRTL, currentLanguage, changeLanguage } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('common.hello')}</h1>
      <p>Current language: {currentLanguage}</p>
      <button onClick={() => changeLanguage('ar')}>Switch to Arabic</button>
    </div>
  );
};
```

## 🔄 Language Switching

The `LanguageSwitcher` component is already added to the header. Users can:

1. Click the globe icon in the header
2. Select their preferred language from the dropdown
3. The app will automatically switch language and text direction

The selected language is persisted in `localStorage` and will be remembered on subsequent visits.

## 📝 Adding New Translations

### 1. Add to English Translation File

Edit `src/locales/en/translation.json`:

```json
{
  "myNewSection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

### 2. Add to Arabic Translation File

Edit `src/locales/ar/translation.json`:

```json
{
  "myNewSection": {
    "title": "عنواني",
    "description": "وصفي"
  }
}
```

### 3. Use in Component

```tsx
const MyComponent = () => {
  const { t } = useTranslation();

  return <h1>{t('myNewSection.title')}</h1>;
};
```

## 🌐 Adding a New Language

### 1. Create Translation File

Create a new directory and translation file:
```
src/locales/fr/translation.json
```

### 2. Update i18n Configuration

Edit `src/locales/i18n.ts`:

```ts
import frTranslation from './fr/translation.json';

const resources = {
  en: { translation: enTranslation },
  ar: { translation: arTranslation },
  fr: { translation: frTranslation }, // Add this
};
```

### 3. Update Language Switcher

Edit `src/components/LanguageSwitcher.tsx`:

```tsx
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' }, // Add this
];
```

### 4. Add RTL Support (if needed)

If the new language is RTL, update `src/locales/i18n.ts`:

```ts
export const rtlLanguages = ['ar', 'he', 'fa', 'ur']; // Add your RTL language code
```

## 🎨 RTL (Right-to-Left) Support

### Automatic RTL Switching

The app automatically detects RTL languages and:
- Sets `dir="rtl"` on the `<html>` element
- Applies RTL-specific CSS rules
- Flips layout and text direction

### RTL-Specific Styling

CSS classes for RTL support are available in `src/index.css`:

```css
/* Automatically applied when direction is RTL */
[dir="rtl"] .text-left {
  text-align: right;
}

/* Flip icons/images horizontally for RTL */
.rtl-flip {
  transform: scaleX(-1);
}
```

### Using RTL in Components

```tsx
import { useI18n } from '@/hooks/useI18n';

const MyComponent = () => {
  const { isRTL } = useI18n();

  return (
    <div className={isRTL ? 'flex-row-reverse' : 'flex-row'}>
      {/* Content */}
    </div>
  );
};
```

## 📋 Translation Keys Structure

### Common Keys
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    // ... basic actions
  }
}
```

### Feature-Specific Keys
```json
{
  "agents": {
    "title": "Your AI Agents",
    "subtitle": "Create and manage...",
    "createAgent": "Create Agent"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "agents": "Agents"
  }
}
```

## 🔧 Configuration

### i18n Configuration (`src/locales/i18n.ts`)

```ts
i18n
  .use(LanguageDetector)     // Auto-detect user language
  .use(initReactI18next)     // React integration
  .init({
    resources,               // Translation files
    fallbackLng: 'en',      // Default language
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });
```

### Language Detection Order

1. **localStorage** - Previously selected language
2. **navigator** - Browser language preference
3. **htmlTag** - HTML lang attribute

## 🎯 Best Practices

### 1. Use Descriptive Keys

❌ Bad:
```json
{ "text1": "Save", "text2": "Cancel" }
```

✅ Good:
```json
{ "common.save": "Save", "common.cancel": "Cancel" }
```

### 2. Organize by Feature

Group related translations:
```json
{
  "agents": { ... },
  "conversations": { ... },
  "settings": { ... }
}
```

### 3. Keep Translations Synchronized

Always update both language files when adding new keys.

### 4. Use Interpolation for Dynamic Content

```tsx
// In translation file
"greeting": "Hello, {{name}}!"

// In component
t('greeting', { name: 'John' }) // Output: "Hello, John!"
```

### 5. Handle Pluralization

```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

```tsx
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 items"
```

## 🐛 Troubleshooting

### Translations Not Showing

1. Check if the key exists in the translation file
2. Verify the translation file is imported in `i18n.ts`
3. Check browser console for i18n errors

### RTL Not Working

1. Verify the language code is in `rtlLanguages` array
2. Check if `dir` attribute is set on `<html>` element
3. Ensure RTL CSS is properly imported

### Language Not Persisting

1. Check browser localStorage for `i18nextLng` key
2. Verify language detection configuration
3. Clear cache and try again

## 📚 Additional Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Tailwind RTL Plugin](https://github.com/20lives/tailwindcss-rtl)

## 🤝 Contributing

When adding new features:

1. Add translation keys to all language files
2. Test with both LTR and RTL languages
3. Update this README if adding new patterns
4. Ensure accessibility with screen readers in all languages
