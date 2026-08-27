import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { BrainCircuitIcon } from '../../../core/components/ui/Icons';

export function LandingHeader() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('app_language', nextLang);
  };

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
      <div className="landing-header-container">
        {/* Brand Logo */}
        <Link to={PATHS.ROOT} className="landing-brand">
          <div className="landing-brand-icon" aria-hidden="true">
            <BrainCircuitIcon size={22} />
          </div>
          <span className="landing-brand-text">{t('brand.name')}</span>
        </Link>

        {/* Navigation Links */}
        <nav className="landing-nav" aria-label="Điều hướng chính">
          <a href="#features" className="landing-nav-link">{t('nav.features')}</a>
          <a href="#how-it-works" className="landing-nav-link">{t('nav.howItWorks')}</a>
          <a href="#testimonials" className="landing-nav-link">{t('nav.testimonials')}</a>
          <a href="#faq" className="landing-nav-link">{t('nav.faq')}</a>
        </nav>

        {/* Action Controls (Lang, Theme, Auth) */}
        <div className="landing-auth-actions">
          {/* Language Switcher */}
          <button
            type="button"
            className="header-util-btn"
            onClick={toggleLanguage}
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            aria-label="Chuyển đổi ngôn ngữ"
          >
            {i18n.language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="header-util-btn"
            onClick={toggleTheme}
            title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
            aria-label="Chuyển đổi giao diện sáng tối"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Auth Buttons */}
          <Link to={PATHS.LOGIN}>
            <Button variant="ghost" size="sm">
              {t('nav.login')}
            </Button>
          </Link>
          <Link to={PATHS.REGISTER}>
            <Button variant="primary" size="sm">
              {t('nav.register')}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
