import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, BookOpen, Brain, FileText, CheckCircle2 } from 'lucide-react';
import { PATHS } from '../../../app/routes/paths';

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-bg-gradient" />
      <div className="hero-glow" />
      
      <div className="landing-section" style={{ position: 'relative', zIndex: 10, width: '100%' }}>
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-badge"
          >
            <Sparkles size={16} />
            <span>AI Teacher Copilot đã chính thức ra mắt</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hero-title"
          >
            Trợ lý AI Đắc lực <br />
            <span className="hero-title-highlight">Dành riêng cho Giáo Viên</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hero-description"
          >
            Chỉ với một cú click, biến tài liệu thô thành Giáo án cấu trúc chuẩn, Đề trắc nghiệm đa dạng và Hệ thống câu hỏi bám sát Bloom Taxonomy. Giải phóng 80% thời gian soạn bài.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hero-buttons"
          >
            <Link to={PATHS.REGISTER} className="btn btn-primary btn-lg">
              Bắt đầu miễn phí
              <ArrowRight size={18} />
            </Link>
            <Link to={PATHS.LOGIN} className="btn btn-outline btn-lg" style={{ background: 'hsl(var(--card))' }}>
              Đăng nhập
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="hero-demo-container"
        >
          <div className="hero-demo-window">
            <div className="demo-header">
              <div className="demo-dot demo-dot-red" />
              <div className="demo-dot demo-dot-yellow" />
              <div className="demo-dot demo-dot-green" />
            </div>
            <div className="demo-body" style={{ background: 'hsl(var(--background))' }}>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="card" style={{ padding: '1.5rem', width: '280px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', borderRadius: '0.5rem' }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ fontWeight: 600 }}>Tài liệu SGK Toán 10</div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'hsl(var(--muted))', borderRadius: '4px', marginBottom: '0.5rem' }} />
                  <div style={{ width: '80%', height: '8px', background: 'hsl(var(--muted))', borderRadius: '4px', marginBottom: '0.5rem' }} />
                  <div style={{ width: '90%', height: '8px', background: 'hsl(var(--muted))', borderRadius: '4px' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  <ArrowRight size={32} />
                </div>

                <div className="card" style={{ padding: '1.5rem', width: '320px', textAlign: 'left', border: '1px solid hsl(var(--primary))', boxShadow: '0 0 15px hsl(var(--primary)/0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderRadius: '0.5rem' }}>
                      <Brain size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>Giáo Án Tự Động</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Đã bám sát Bloom Taxonomy</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle2 size={16} color="hsl(var(--success-text, 152 69% 25%))" /> 1. Mục tiêu bài học
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle2 size={16} color="hsl(var(--success-text, 152 69% 25%))" /> 2. Hoạt động khởi động
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <CheckCircle2 size={16} color="hsl(var(--success-text, 152 69% 25%))" /> 3. Trắc nghiệm kiểm tra
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
