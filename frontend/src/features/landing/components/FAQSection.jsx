import React, { useState } from 'react';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'AI Teacher Copilot có đảm bảo đúng khung bài dạy theo Công văn 5512 không?',
      a: 'Hoàn toàn đảm bảo. Bản thảo giáo án được cấu trúc nghiêm ngặt theo 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng, có phân định rõ Hoạt động của Giáo viên & Hoạt động của Học sinh kèm Sản phẩm kỳ vọng.',
    },
    {
      q: 'Dữ liệu tài liệu học liệu của tôi có được bảo mật không?',
      a: 'Có. Mỗi tài khoản giáo viên sở hữu Không gian làm việc (Workspace) riêng biệt. Tài liệu bạn tải lên chỉ được sử dụng để truy xuất tri thức cho tài khoản của bạn, tuyệt đối không chia sẻ ra ngoài.',
    },
    {
      q: 'Tôi có thể tải giáo án và đề thi về định dạng Word (.docx) không?',
      a: 'Có. Hệ thống hỗ trợ xuất file DOCX và PDF chuẩn lề, font chữ sư phạm, sẵn sàng cho việc in ấn, lưu trữ hoặc nộp tổ chuyên môn mà không cần định dạng lại từ đầu.',
    },
    {
      q: 'Hệ thống hỗ trợ những bộ sách giáo khoa nào của GDPT 2018?',
      a: 'Hệ thống hỗ trợ nạp tất cả các bộ SGK hiện hành (Kết nối tri thức với cuộc sống, Chân trời sáng tạo, Cánh diều) cũng như tài liệu bổ trợ, chuyên đề tự chọn từ lớp 1 đến lớp 12.',
    },
  ];

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <div className="section-header-centered">
          <div className="section-tag">Giải Đáp Thắc Mắc</div>
          <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          <p className="section-subtitle">
            Những thông tin cần biết để bắt đầu sử dụng AI Teacher Copilot hiệu quả nhất.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
