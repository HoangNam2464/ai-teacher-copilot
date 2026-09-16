import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { supportedLanguages, languageNames } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  const currentLang = (i18n.resolvedLanguage || i18n.language || 'vi').substring(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label={t('common.changeLanguage', 'Language')}
        title={languageNames[currentLang] || 'Language'}
      >
        <Globe className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="p-1">
            {supportedLanguages.map((lang) => {
              const isSelected = currentLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span>{languageNames[lang]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
