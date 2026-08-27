import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { BrainCircuitIcon } from '../../../core/components/ui/Icons';

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
      <div className="landing-header-container">
        {/* Brand Logo */}
        <Link to={PATHS.ROOT} className="landing-brand">
          <div className="landing-brand-icon" aria-hidden="true">
            <BrainCircuitIcon size={22} />
          </div>
          <span className="landing-brand-text">AI Teacher Copilot</span>
        </Link>

        {/* Navigation Links */}
        <nav className="landing-nav" aria-label="Điều hướng chính">
          <a href="#features" className="landing-nav-link">Tính Năng</a>
          <a href="#how-it-works" className="landing-nav-link">Quy Trình</a>
          <a href="#testimonials" className="landing-nav-link">Đánh Giá</a>
          <a href="#faq" className="landing-nav-link">Câu Hỏi Thường Gặp</a>
        </nav>

        {/* Auth CTA Actions */}
        <div className="landing-auth-actions">
          <Link to={PATHS.LOGIN}>
            <Button variant="ghost" size="sm">
              Đăng Nhập
            </Button>
          </Link>
          <Link to={PATHS.REGISTER}>
            <Button variant="primary" size="sm">
              Bắt Đầu Miễn Phí
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
