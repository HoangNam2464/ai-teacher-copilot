import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../app/routes/paths';
import { BrainCircuitIcon } from '../../../core/components/ui/Icons';

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="footer-top-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <div className="landing-brand">
              <div className="landing-brand-icon" aria-hidden="true">
                <BrainCircuitIcon size={20} />
              </div>
              <span className="landing-brand-text">AI Teacher Copilot</span>
            </div>
            <p className="footer-brand-desc">
              Trợ lý AI chuyên biệt cho giáo viên K-12 Việt Nam. Đồng hành nâng cao hiệu quả giảng dạy và giảm tải hồ sơ sư phạm.
            </p>
          </div>

          {/* Links Col 1: Sản phẩm */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Sản Phẩm</h4>
            <ul className="footer-links-list">
              <li><a href="#features">Soạn Giáo Án 5512</a></li>
              <li><a href="#features">Trích Dẫn SGK Minh Bạch</a></li>
              <li><a href="#features">Ra Đề Thi &amp; Ma Trận Bloom</a></li>
              <li><a href="#features">Xuất File Word / PDF</a></li>
            </ul>
          </div>

          {/* Links Col 2: Truy cập */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Tài Khoản</h4>
            <ul className="footer-links-list">
              <li><Link to={PATHS.LOGIN}>Đăng Nhập</Link></li>
              <li><Link to={PATHS.REGISTER}>Đăng Ký Tài Khoản</Link></li>
              <li><Link to={PATHS.WORKSPACES}>Không Gian Làm Việc</Link></li>
            </ul>
          </div>

          {/* Links Col 3: Chuẩn Mực */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Chuẩn Sư Phạm</h4>
            <ul className="footer-links-list">
              <li><span>Chương trình GDPT 2018</span></li>
              <li><span>Công văn số 5512/BGDĐT-GDTrH</span></li>
              <li><span>Thang đo tư duy Bloom K-12</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div>© 2026 AI Teacher Copilot for K-12 Teachers. All rights reserved.</div>
          <div>Thiết kế vì sự phát triển của nền Giáo dục Việt Nam.</div>
        </div>
      </div>
    </footer>
  );
}
