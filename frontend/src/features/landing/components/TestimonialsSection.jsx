import React from 'react';

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'Trước đây mỗi lần soạn kế hoạch bài dạy 5512 mất cả buổi tối. Giờ đây với AI Teacher Copilot, tôi chỉ mất 15 phút là có bản thảo đầy đủ 4 hoạt động bám sát SGK để tinh chỉnh theo ý mình.',
      author: 'Thầy Nguyễn Hoàng Nam',
      role: 'Giáo viên Toán THPT — Hà Nội',
    },
    {
      quote:
        'Điều tôi yên tâm nhất là tính năng trích dẫn SGK minh bạch. AI không tự bịa kiến thức mà luôn đối chiếu chính xác ngữ liệu văn bản gốc.',
      author: 'Cô Trần Thị Mai',
      role: 'Giáo viên Ngữ Văn THCS — Đà Nẵng',
    },
    {
      quote:
        'Khả năng tạo câu hỏi trắc nghiệm kèm ma trận nhận thức Bloom giúp tổ chuyên môn tiết kiệm rất nhiều công sức khi làm ngân hàng đề kiểm tra định kỳ.',
      author: 'Thầy Lê Quốc Bảo',
      role: 'Giáo viên KHTN — TP. Hồ Chí Minh',
    },
  ];

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-container">
        <div className="section-header-centered">
          <div className="section-tag">Đánh Giá Từ Thầy Cô</div>
          <h2 className="section-title">Được Tin Chọn Bởi Giáo Viên Toàn Quốc</h2>
          <p className="section-subtitle">
            Những chia sẻ thực tế từ các thầy cô đang ứng dụng AI Teacher Copilot trong giảng dạy hàng ngày.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-quote">&ldquo;{item.quote}&rdquo;</p>
              <div className="testimonial-author-box">
                <div className="testimonial-author-name">{item.author}</div>
                <div className="testimonial-author-role">{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
