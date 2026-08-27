import React from 'react';
import {
  BookOpenIcon,
  SparklesIcon,
  FileTextIcon,
  ArrowRightIcon,
} from '../../../core/components/ui/Icons';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: <BookOpenIcon size={24} />,
      title: 'Tải Sách & Học Liệu',
      desc: 'Tải sách giáo khoa PDF (Kết nối tri thức, Chân trời sáng tạo, Cánh diều) hoặc tài liệu bài giảng vào Không gian làm việc riêng của môn học.',
      badge: 'Lập chỉ mục ngữ nghĩa',
    },
    {
      step: '02',
      icon: <SparklesIcon size={24} />,
      title: 'AI Sinh Bản Thảo Bám Sát SGK',
      desc: 'Chọn tên bài, khối lớp và mục tiêu sư phạm. AI Copilot phân tích dữ liệu, tự động dựng kịch bản 4 hoạt động 5512 hoặc bộ đề thi ma trận Bloom.',
      badge: 'RAG Grounding chính xác',
    },
    {
      step: '03',
      icon: <FileTextIcon size={24} />,
      title: 'Tinh Chỉnh & Xuất Bản 1-Click',
      desc: 'Giáo viên duyệt nhanh, chỉnh sửa linh hoạt theo năng lực học sinh từng lớp, đối chiếu trích dẫn nguồn và xuất file Word/PDF hoàn hảo.',
      badge: 'Xuất DOCX chuẩn mẫu',
    },
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="how-it-works-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-tag">Quy Trình Chuẩn Sư Phạm</div>
          <h2 className="section-title">Đơn Giản Hóa Hồ Sơ Bài Dạy Chỉ Trong 3 Bước</h2>
          <p className="section-subtitle">
            Quy trình khép kín giúp thầy cô tiết kiệm tối đa thời gian mà vẫn đảm bảo tính khoa học và chuẩn mực sư phạm.
          </p>
        </div>

        {/* 3 Step Cards with Connectors */}
        <div className="steps-container">
          <div className="steps-grid">
            {steps.map((item, index) => (
              <div key={index} className="step-card">
                <div className="step-card-header">
                  <span className="step-number">{item.step}</span>
                  <div className="step-icon-badge">{item.icon}</div>
                </div>

                <div className="step-pill">{item.badge}</div>

                <h3 className="step-title">{item.title}</h3>
                <p className="step-desc">{item.desc}</p>

                {index < steps.length - 1 && (
                  <div className="step-connector" aria-hidden="true">
                    <ArrowRightIcon size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
