import React from 'react';

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Tải Lên Sách & Học Liệu',
      desc: 'Tải file PDF/DOCX SGK (Kết nối tri thức, Cánh diều, Chân trời sáng tạo) hoặc giáo trình vào Không gian làm việc riêng của môn học.',
    },
    {
      step: '02',
      title: 'AI Sinh Bản Thảo Bài Dạy',
      desc: 'Lựa chọn bài học, khối lớp và thời lượng. AI trích xuất nội dung chuẩn xác và tự động dựng kịch bản 4 hoạt động sư phạm hoặc đề thi.',
    },
    {
      step: '03',
      title: 'Duyệt, Chỉnh Sửa & Xuất File',
      desc: 'Giáo viên linh hoạt chỉnh sửa theo phong cách dạy học cá nhân, đối soát minh chứng trang sách và xuất file Word/PDF hoàn chỉnh.',
    },
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="how-it-works-container">
        <div className="section-header-centered">
          <div className="section-tag">Quy Trình 3 Bước</div>
          <h2 className="section-title">Đơn Giản Hóa Chuẩn Bị Giáo Án Chỉ Trong Vài Phút</h2>
          <p className="section-subtitle">
            Quy trình khép kín giúp thầy cô tiết kiệm tối đa thời gian mà vẫn đảm bảo tính khoa học và chuẩn mực sư phạm.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((item, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
