import React, { useState } from 'react';
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
  ShieldCheckIcon,
} from '../../../core/components/ui/Icons';
import { BloomTaxonomyTag } from '../../../core/components/ui/BloomTaxonomyTag';
import { CitationBadge } from '../../../core/components/citation/CitationBadge';

export function HeroSection() {
  const [activeTab, setActiveTab] = useState('lesson'); // 'lesson' | 'quiz' | 'matrix'

  return (
    <section className="hero-section" id="hero">
      <div className="hero-container">
        {/* Top Tag */}
        <div className="hero-badge-pill">
          <SparklesIcon size={14} />
          <span>AI Chuyên Biệt Cho Giáo Viên K-12</span>
          <span className="hero-badge-divider" />
          <span className="hero-badge-highlight">Chuẩn GDPT 2018 &amp; 5512</span>
        </div>

        {/* Main Headline with GradientText */}
        <h1 className="hero-headline">
          Kiến Tạo Kế Hoạch Bài Dạy &amp; Đề Thi Chuẩn Sư Phạm{' '}
          <GradientText underline>Chỉ Trong Vài Phút</GradientText>
        </h1>

        {/* Subtitle */}
        <p className="hero-description">
          Trợ lý AI bám sát sách giáo khoa, tự động hóa ma trận nhận thức Bloom,
          trích dẫn nguồn minh bạch và đồng hành cùng thầy cô giảm 70% thời gian chuẩn bị hồ sơ chuyên môn.
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
            <Button variant="outline" size="lg" className="hero-secondary-btn">
              <span>Khám Phá Quy Trình 3 Bước</span>
            </Button>
          </a>
        </div>

        {/* Value Trust Tags */}
        <div className="hero-trust-tags">
          <div className="trust-tag-item">
            <CheckCircle2Icon size={15} />
            <span>Đúng khung Công Văn 5512</span>
          </div>
          <div className="trust-tag-item">
            <ShieldCheckIcon size={15} />
            <span>Đối soát trang SGK gốc</span>
          </div>
          <div className="trust-tag-item">
            <CheckCircle2Icon size={15} />
            <span>Xuất file Word &amp; PDF 1-click</span>
          </div>
        </div>

        {/* Interactive UI Mockup Card with Ambient Glow Layer */}
        <div className="hero-mockup-wrapper">
          {/* Ambient Glow Background behind Mockup */}
          <div className="hero-mockup-glow" aria-hidden="true" />

          <div className="hero-mockup-card">
            {/* Mockup Titlebar */}
            <div className="mockup-titlebar">
              <div className="mockup-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="mockup-tab-selector">
                <button
                  type="button"
                  className={`mockup-tab-btn ${activeTab === 'lesson' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lesson')}
                >
                  <FileTextIcon size={13} />
                  <span>Kế Hoạch Bài Dạy (5512)</span>
                </button>
                <button
                  type="button"
                  className={`mockup-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quiz')}
                >
                  <SparklesIcon size={13} />
                  <span>Ma Trận &amp; Đề Thi Bloom</span>
                </button>
              </div>
              <div className="mockup-action-pill">
                <span className="live-pulse" />
                <span>RAG Active</span>
              </div>
            </div>

            {/* Mockup Body: Dual Pane */}
            <div className="mockup-dual-pane">
              {/* Left Panel: Pedagogical Context Input */}
              <div className="mockup-pane-left">
                <div className="mockup-sidebar-header">
                  <span className="mockup-sidebar-title">Thiết Lập Bài Giảng</span>
                </div>

                <div className="mockup-field-group">
                  <label className="mockup-label">Môn học &amp; Bộ Sách</label>
                  <div className="mockup-input-static">Toán học 10 — Chân Trời Sáng Tạo</div>
                </div>

                <div className="mockup-field-group">
                  <label className="mockup-label">Tên bài học</label>
                  <div className="mockup-input-static">Bài 2: Hàm số bậc hai &amp; Đồ thị</div>
                </div>

                <div className="mockup-field-group">
                  <label className="mockup-label">Học liệu trích xuất (SGK)</label>
                  <div className="mockup-doc-pill">
                    <BookOpenIcon size={13} />
                    <span>SGK_Toan_10_Tap1.pdf</span>
                    <span className="mockup-chunk-tag">45 chunks</span>
                  </div>
                </div>

                <div className="mockup-field-group">
                  <label className="mockup-label">Phương pháp trọng tâm</label>
                  <div className="mockup-tag-group">
                    <span className="mockup-badge-mini">Dạy học giải quyết vấn đề</span>
                    <span className="mockup-badge-mini">Thảo luận nhóm</span>
                  </div>
                </div>
              </div>

              {/* Right Panel: Live Pedagogical Document */}
              <div className="mockup-pane-right">
                {activeTab === 'lesson' ? (
                  <div className="mockup-doc-content">
                    <div className="mockup-doc-header">
                      <div>
                        <div className="mockup-doc-main-title">KẾ HOẠCH BÀI DẠY: HÀM SỐ BẬC HAI</div>
                        <div className="mockup-doc-sub">Thời lượng: 2 Tiết · Khối 10 · Khung 5512/BGDĐT</div>
                      </div>
                      <div className="mockup-badges-row">
                        <BloomTaxonomyTag level="Apply" showVietnamese />
                        <CitationBadge count={3} />
                      </div>
                    </div>

                    <div className="mockup-section-block">
                      <div className="mockup-section-title">I. MỤC TIÊU BÀI DẠY:</div>
                      <div className="mockup-objective-grid">
                        <div className="mockup-obj-item">
                          <span className="mockup-obj-bullet">1. Về kiến thức:</span>
                          <p>Hiểu định nghĩa hàm số bậc hai $y = ax^2 + bx + c$ ($a \neq 0$), xác định tọa độ đỉnh $I(-b/2a; -\Delta/4a)$ và trục đối xứng.</p>
                        </div>
                        <div className="mockup-obj-item">
                          <span className="mockup-obj-bullet">2. Về năng lực:</span>
                          <p>Năng lực mô hình hóa toán học qua bài toán thực tế quỹ đạo chuyển động ném xiên và cổng Parabol.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mockup-section-block">
                      <div className="mockup-section-title">II. HOẠT ĐỘNG 1: KHỞI ĐỘNG (10 PHÚT)</div>
                      <div className="mockup-activity-table">
                        <div className="mockup-activity-col">
                          <strong>Hoạt động Giáo viên &amp; Học sinh</strong>
                          <p>GV chiếu hình ảnh cầu Trường Tiền và quỹ đạo tia nước. Yêu cầu HS quan sát và nêu nhận xét về hình dạng đường cong parabol.</p>
                        </div>
                        <div className="mockup-activity-col">
                          <strong>Sản phẩm kỳ vọng</strong>
                          <p>HS nhận biết được hình dạng đường cong mở lên hoặc úp xuống, ghi nhận được đồ thị có trục đối xứng qua đỉnh.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mockup-doc-content">
                    <div className="mockup-doc-header">
                      <div>
                        <div className="mockup-doc-main-title">MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ</div>
                        <div className="mockup-doc-sub">Thời gian làm bài: 45 phút · 70% TNKQ + 30% Tự luận</div>
                      </div>
                      <div className="mockup-badges-row">
                        <BloomTaxonomyTag level="Analyze" showVietnamese />
                        <CitationBadge count={4} />
                      </div>
                    </div>

                    <div className="mockup-quiz-preview">
                      <div className="mockup-question-item">
                        <div className="mockup-q-head">
                          <span><strong>Câu 1:</strong> Trục đối xứng của parabol $y = 2x^2 - 4x + 1$ là đường thẳng:</span>
                          <BloomTaxonomyTag level="Remember" />
                        </div>
                        <div className="mockup-q-options">
                          <span className="q-opt">A. $x = -1$</span>
                          <span className="q-opt q-opt--correct">B. $x = 1$ ✓</span>
                          <span className="q-opt">C. $x = 2$</span>
                          <span className="q-opt">D. $x = -2$</span>
                        </div>
                      </div>

                      <div className="mockup-question-item">
                        <div className="mockup-q-head">
                          <span><strong>Câu 2:</strong> Tìm giá trị $m$ để đồ thị hàm số $y = x^2 - 2mx + m + 2$ cắt trục hoành tại 2 điểm phân biệt:</span>
                          <BloomTaxonomyTag level="Apply" />
                        </div>
                        <div className="mockup-q-explanation">
                          <span>💡 Lời giải chi tiết: Phương trình có $\Delta' = m^2 - m - 2 &gt; 0 \iff m &lt; -1$ hoặc $m &gt; 2$.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
