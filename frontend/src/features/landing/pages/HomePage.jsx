import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { CTASection } from '../components/CTASection';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../app/routes/paths';
import { BrainCircuit } from 'lucide-react';
import '../../../styles/landing.css';

export function HomePage() {
  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'hsl(var(--background)/0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BrainCircuit size={28} color="hsl(var(--primary))" />
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Teacher Copilot</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to={PATHS.LOGIN} className="btn btn-ghost">Đăng nhập</Link>
            <Link to={PATHS.REGISTER} className="btn btn-primary">Đăng ký</Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <footer style={{ borderTop: '1px solid hsl(var(--border))', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={20} />
            <span>© 2026 AI Teacher Copilot. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Điều khoản</Link>
            <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Bảo mật</Link>
            <Link to="#" style={{ textDecoration: 'none', color: 'inherit' }}>Liên hệ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
