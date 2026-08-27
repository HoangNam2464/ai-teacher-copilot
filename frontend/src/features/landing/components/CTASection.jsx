import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { ArrowRightIcon } from '../../../core/components/ui/Icons';

export function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <h2 className="cta-title">Sẵn Sàng Nâng Tầm Hồ Sơ Dạy Học Của Thầy Cô?</h2>
          <p className="cta-subtitle">
            Trải nghiệm trợ lý soạn kế hoạch bài dạy và đề thi bám sát chương trình GDPT 2018 ngay hôm nay.
          </p>
          <div className="cta-actions">
            <Link to={PATHS.REGISTER}>
              <Button variant="default" size="lg" className="cta-btn">
                <span>Tạo Tài Khoản Giáo Viên Ngay</span>
                <ArrowRightIcon size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
