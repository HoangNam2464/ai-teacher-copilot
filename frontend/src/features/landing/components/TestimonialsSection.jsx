import React from 'react';

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        'Trước đây mỗi lần soạn kế hoạch bài dạy 5512 mất cả buổi tối để tra cứu bảng biểu và mục tiêu. Giờ đây với AI Teacher Copilot, tôi chỉ mất 15 phút là có bản thảo đầy đủ 4 hoạt động bám sát SGK Chân Trời Sáng Tạo để tinh chỉnh theo ý mình.',
      author: 'Thầy Nguyễn Hoàng Nam',
      role: 'Tổ trưởng Chuyên môn Toán THPT',
      school: 'THPT Chuyên Hà Nội — Amsterdam',
      initials: 'HN',
      tag: 'Toán học 10-12',
    },
    {
      quote:
        'Điều tôi yên tâm nhất là tính năng trích dẫn SGK minh bạch. AI không tự bịa kiến thức hay ngữ liệu lạ mà luôn đối chiếu chính xác đoạn văn trong SGK Ngữ Văn, giúp tiết dạy đọc hiểu có căn cứ vững chắc.',
      author: 'Cô Trần Thị Mai',
      role: 'Giáo viên Ngữ Văn THCS',
      school: 'THCS Lê Quý Đôn — Đà Nẵng',
      initials: 'TM',
      tag: 'Ngữ văn 6-9',
    },
    {
      quote:
        'Khả năng sinh câu hỏi trắc nghiệm kèm ma trận nhận thức Bloom chuẩn xác giúp tổ Khoa Học Tự Nhiên tiết kiệm đến 80% công sức khi làm ngân hàng đề kiểm tra giữa kỳ và cuối kỳ.',
      author: 'Thầy Lê Quốc Bảo',
      role: 'Giáo viên Vật lý & KHTN',
      school: 'THPT Nguyễn Thị Minh Khai — TP.HCM',
      initials: 'QB',
      tag: 'Vật lý & KHTN',
    },
  ];

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="testimonials-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-tag">Đồng Nghiệp Chia Sẻ</div>
          <h2 className="section-title">Được Tin Dùng Bởi Giáo Viên Toàn Quốc</h2>
          <p className="section-subtitle">
            Lắng nghe trải nghiệm thực tế từ các thầy cô đang ứng dụng AI Teacher Copilot trong công tác giảng dạy hàng ngày.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <div key={index} className="testimonial-card">
              {/* Star Rating */}
              <div className="testimonial-stars" aria-label="Đánh giá 5 sao">
                {'★★★★★'}
              </div>

              {/* Quote */}
              <p className="testimonial-quote">&ldquo;{item.quote}&rdquo;</p>

              {/* Author Info */}
              <div className="testimonial-author-box">
                <div className="testimonial-avatar" aria-hidden="true">
                  {item.initials}
                </div>
                <div className="testimonial-author-details">
                  <div className="testimonial-author-name">{item.author}</div>
                  <div className="testimonial-author-role">{item.role}</div>
                  <div className="testimonial-author-school">{item.school}</div>
                </div>
                <div className="testimonial-subject-badge">{item.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
