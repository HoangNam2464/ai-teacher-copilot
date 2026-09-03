import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PATHS } from '../../../app/routes/paths';

export function CTASection() {
  return (
    <section className="landing-section" style={{ padding: '0 1rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="cta-section"
      >
        <Sparkles size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
        <h2 className="cta-title">Sẵn sàng để thay đổi phương pháp giảng dạy?</h2>
        <p className="cta-desc">
          Bắt đầu miễn phí ngay hôm nay. Khám phá sức mạnh của AI trong việc tạo ra trải nghiệm giáo dục cá nhân hóa và giảm tải 80% áp lực soạn bài.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={PATHS.REGISTER} className="btn btn-lg" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--primary))', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}>
            Đăng ký miễn phí
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
