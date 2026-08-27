import React from 'react';
import {
  BookOpenIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from '../../../core/components/ui/Icons';

export function FeaturesSection() {
  const features = [
    {
      icon: <BookOpenIcon size={24} />,
      title: 'Soạn Giáo Án Chuẩn Mẫu 5512',
      description:
        'Cấu trúc bài bản theo 4 hoạt động sư phạm: Khởi động, Hình thành kiến thức, Luyện tập và Vận dụng, tích hợp mục tiêu Năng lực & Phẩm chất.',
    },
    {
      icon: <ShieldCheckIcon size={24} />,
      title: 'RAG Trích Dẫn SGK Minh Bạch',
      description:
        'Mọi nội dung do AI đề xuất đều gắn kèm trích dẫn số trang, đoạn văn từ sách giáo khoa gốc. Giáo viên luôn là người làm chủ quyết định cuối cùng.',
    },
    {
      icon: <SparklesIcon size={24} />,
      title: 'Đề Thi Phân Loại Ma Trận Bloom',
      description:
        'Tự động sinh ngân hàng câu hỏi trắc nghiệm & tự luận gắn nhãn 4 mức độ tư duy Bloom, có đáp án và lời giải chi tiết phục vụ kiểm tra đánh giá.',
    },
    {
      icon: <FileTextIcon size={24} />,
      title: 'Xuất File Word & PDF Sư Phạm',
      description:
        'Tải về hồ sơ dạy học với định dạng chuẩn lề, bảng biểu rõ ràng và chân trang trích dẫn, sẵn sàng nộp tổ chuyên môn hoặc in ấn sử dụng ngay.',
    },
  ];

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <div className="section-header-centered">
          <div className="section-tag">Tính Năng Cốt Lõi</div>
          <h2 className="section-title">Giải Pháp Toàn Diện Cho Hồ Sơ Dạy Học K-12</h2>
          <p className="section-subtitle">
            Thiết kế chuyên sâu phục vụ nhu cầu thực tế của giáo viên theo chương trình Giáo dục Phổ thông 2018.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon-box">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
