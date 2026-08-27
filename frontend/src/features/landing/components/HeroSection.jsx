import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { GradientText } from '../../../core/components/craft/GradientText';
import {
  SparklesIcon,
  ArrowRightIcon,
  BookOpenIcon,
  FileTextIcon,
  CheckCircle2Icon,
} from '../../../core/components/ui/Icons';
import { BloomTaxonomyTag } from '../../../core/components/ui/BloomTaxonomyTag';
import { CitationBadge } from '../../../core/components/citation/CitationBadge';

export function HeroSection() {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-container">
        {/* Top Tag */}
        <div className="hero-badge-pill">
          <SparklesIcon size={14} />
          <span>Trợ Lý Sư Phạm AI Chuẩn GDPT 2018</span>
        </div>

        {/* Main Headline with GradientText */}
        <h1 className="hero-headline">
          Soạn Kế Hoạch Bài Dạy &amp; Đề Thi Chuẩn Sư Phạm{' '}
          <GradientText underline>Nhanh Gấp 5 Lần</GradientText>
        </h1>

        {/* Subtitle */}
        <p className="hero-description">
          AI Copilot chuyên biệt cho giáo viên K-12: Trích dẫn minh chứng sách giáo khoa minh bạch,
          tự động hóa ma trận Bloom và đồng hành cùng thầy cô giảm tải áp lực hồ sơ sư phạm.
        </p>

        {/* Action CTAs */}
        <div className="hero-cta-group">
          <Link to={PATHS.REGISTER}>
            <Button variant="primary" size="lg" className="hero-primary-btn">
              <span>Bắt Đầu Soạn Giáo Án Miễn Phí</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRightIcon size={18} />
              </motion.span>
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="outline" size="lg">
              Xem Quy Trình 3 Bước
            </Button>
          </a>
        </div>

        {/* Value Trust Tags */}
        <div className="hero-trust-tags">
          <div className="trust-tag-item">
            <CheckCircle2Icon size={16} />
            <span>Đúng mẫu Công Văn 5512</span>
          </div>
          <div className="trust-tag-item">
            <CheckCircle2Icon size={16} />
            <span>Trích dẫn SGK gốc</span>
          </div>
          <div className="trust-tag-item">
            <CheckCircle2Icon size={16} />
            <span>Xuất file Word &amp; PDF</span>
          </div>
        </div>

        {/* Interactive UI Mockup Card (Dual-Pane Preview) */}
        <div className="hero-mockup-wrapper">
          <div className="hero-mockup-card">
            {/* Mockup Titlebar */}
            <div className="mockup-titlebar">
              <div className="mockup-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="mockup-url-bar">
                <FileTextIcon size={14} />
                <span>ai-teacher-copilot.edu.vn/lesson-planner</span>
              </div>
              <div className="mockup-action-pill">
                <span className="live-pulse" />
                <span>RAG Active</span>
              </div>
            </div>

            {/* Mockup Body: Dual Pane */}
            <div className="mockup-dual-pane">
              {/* Left Panel: Setup Form */}
              <div className="mockup-pane-left">
                <div className="mockup-field-group">
                  <div className="mockup-label">Môn học &amp; Khối lớp</div>
                  <div className="mockup-input-static">Toán học — Lớp 10 (Chân Trời Sáng Tạo)</div>
                </div>
                <div className="mockup-field-group">
                  <div className="mockup-label">Tên bài học</div>
                  <div className="mockup-input-static">Hàm số bậc hai và đồ thị (Tiết 1)</div>
                </div>
                <div className="mockup-field-group">
                  <div className="mockup-label">Học liệu trích xuất</div>
                  <div className="mockup-doc-pill">
                    <BookOpenIcon size={13} />
                    <span>SGK_Toan_10_Tap1.pdf (Đã lập chỉ mục)</span>
                  </div>
                </div>
              </div>

              {/* Right Panel: AI Live Output Document */}
              <div className="mockup-pane-right">
                <div className="mockup-doc-header">
                  <div className="mockup-doc-title">KẾ HOẠCH BÀI DẠY (KHBD 5512)</div>
                  <div className="mockup-badges-row">
                    <BloomTaxonomyTag level="Apply" showVietnamese />
                    <CitationBadge count={3} />
                  </div>
                </div>

                <div className="mockup-doc-section">
                  <strong>I. MỤC TIÊU BÀI HỌC:</strong>
                  <ul>
                    <li>1. Nắm vững định nghĩa và dạng tổng quát của hàm số bậc hai.</li>
                    <li>2. Nhận biết và vẽ được đồ thị Parabol với đỉnh $I(x_0, y_0)$.</li>
                  </ul>
                </div>

                <div className="mockup-doc-section">
                  <strong>II. HOẠT ĐỘNG KHỞI ĐỘNG (10 phút):</strong>
                  <p className="mockup-doc-text">
                    Giáo viên trình chiếu quỹ đạo cầu vồng hoặc cổng parabol St. Louis, yêu cầu học sinh thảo luận cặp đôi về hình dáng đường cong...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
