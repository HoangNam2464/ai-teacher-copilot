import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { ArrowRightIcon, SparklesIcon, CheckCircle2Icon } from '../../../core/components/ui/Icons';

export function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          {/* Radial Glow FX */}
          <div className="cta-glow-fx" aria-hidden="true" />

          {/* Badge */}
          <div className="cta-badge">
            <SparklesIcon size={14} />
            <span>Miễn Phí Dành Cho Giáo Viên K-12</span>
          </div>

          {/* Headline */}
          <h2 className="cta-title">Sẵn Sàng Nâng Tầm Hồ Sơ Dạy Học Của Thầy Cô?</h2>

          {/* Subtitle */}
          <p className="cta-subtitle">
            Trải nghiệm trợ lý AI soạn kế hoạch bài dạy 5512, trích dẫn SGK và ra đề thi ma trận Bloom ngay hôm nay. Không yêu cầu thẻ tín dụng.
          </p>

          {/* Action Buttons */}
          <div className="cta-actions">
            <Link to={PATHS.REGISTER}>
              <Button variant="default" size="lg" className="cta-btn">
                <span>Tạo Tài Khoản Giáo Viên Miễn Phí</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRightIcon size={18} />
                </motion.span>
              </Button>
            </Link>
          </div>

          {/* Guarantee Badges */}
          <div className="cta-guarantees">
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>Khởi tạo trong 30 giây</span>
            </div>
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>Bảo mật dữ liệu học liệu sư phạm</span>
            </div>
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>Không giới hạn số lần xuất Word</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
