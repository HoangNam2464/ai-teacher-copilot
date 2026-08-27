import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  GraduationCapIcon,
  BookOpenIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '../components/ui/Icons';

export function AuthLayout() {
  return (
    <div className="auth-split-wrapper">
      {/* Left Branding & Hero Panel (Desktop) */}
      <aside className="auth-hero-panel" aria-label="Giới thiệu AI Teacher Copilot">
        <div className="auth-hero-header">
          <div className="auth-hero-logo" aria-hidden="true">
            <GraduationCapIcon size={26} />
          </div>
          <span className="auth-hero-brand-name">AI Teacher Copilot</span>
        </div>

        <div className="auth-hero-body">
          <div className="auth-hero-tag">
            <SparklesIcon size={14} />
            <span>Chuẩn GDPT 2018 &amp; Công Văn 5512</span>
          </div>

          <h1 className="auth-hero-title">
            Kiến tạo Kế hoạch Bài dạy &amp; Đề thi Chuẩn Sư phạm trong vài phút.
          </h1>

          <p className="auth-hero-description">
            Trợ lý AI chuyên biệt dành cho giáo viên K-12: Trích dẫn chính xác Sách Giáo Khoa,
            tự động hóa ma trận đề thi chuẩn ma trận Bloom và giảm 70% thời gian chuẩn bị học liệu.
          </p>

          <div className="auth-hero-features">
            <div className="auth-hero-feature-item">
              <div className="auth-hero-feature-icon" aria-hidden="true">
                <BookOpenIcon size={18} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Soạn Giáo Án Theo Chuẩn 5512</h4>
                <p>Khung hoạt động sư phạm bài bản, đa dạng hình thức dạy học tích cực.</p>
              </div>
            </div>

            <div className="auth-hero-feature-item">
              <div className="auth-hero-feature-icon" aria-hidden="true">
                <SparklesIcon size={18} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Ra Đề Thi &amp; Ma Trận Bloom Tự Động</h4>
                <p>Tạo câu hỏi trắc nghiệm &amp; tự luận bám sát 4 mức độ nhận thức.</p>
              </div>
            </div>

            <div className="auth-hero-feature-item">
              <div className="auth-hero-feature-icon" aria-hidden="true">
                <ShieldCheckIcon size={18} />
              </div>
              <div className="auth-hero-feature-text">
                <h4>Trích Dẫn Minh Chứng SGK Minh Bạch</h4>
                <p>Mọi nội dung AI sinh ra đều có liên kết đối soát trang sách giáo khoa gốc.</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="auth-hero-footer">
          <span>© 2026 AI Teacher Copilot</span>
          <span>Đồng hành cùng Giáo dục Việt Nam</span>
        </footer>
      </aside>

      {/* Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-form-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
