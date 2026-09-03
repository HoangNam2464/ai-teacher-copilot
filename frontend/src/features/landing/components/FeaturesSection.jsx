import React from 'react';
import { Brain, FileText, Target, Network, Layers, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <FileText size={24} />,
    title: 'Quản Lý Tài Liệu Trực Quan',
    description: 'Tải lên SGK, tài liệu tham khảo (PDF, Word). Hệ thống tự động trích xuất, phân tách và quản lý theo từng Workspace (lớp, môn học) riêng biệt.'
  },
  {
    icon: <Brain size={24} />,
    title: 'Soạn Giáo Án Bằng AI',
    description: 'Tự động thiết kế giáo án chuẩn mực với các hoạt động khởi động, hình thành kiến thức và luyện tập dựa trên kho tài liệu đã cung cấp.'
  },
  {
    icon: <Target size={24} />,
    title: 'Sinh Đề Thi & Trắc Nghiệm',
    description: 'Tạo hàng loạt câu hỏi trắc nghiệm và tự luận chỉ với một thao tác. Hỗ trợ xuất trực tiếp ra file Word hoặc PDF định dạng chuẩn.'
  },
  {
    icon: <Layers size={24} />,
    title: 'Tích Hợp Bloom Taxonomy',
    description: 'Bộ câu hỏi và giáo án được AI tự động phân loại, gắn tag theo 6 cấp độ nhận thức của thang đo Bloom (Nhớ, Hiểu, Vận dụng, Phân tích, Đánh giá, Sáng tạo).'
  },
  {
    icon: <Network size={24} />,
    title: 'Truy Xuất Dữ Liệu RAG',
    description: 'AI không tự "bịa" ra nội dung (Hallucination). Mọi câu trả lời, giáo án và đề thi đều được trích xuất và trích dẫn ngược lại đúng trang tài liệu gốc.'
  },
  {
    icon: <Zap size={24} />,
    title: 'Tiết Kiệm 80% Thời Gian',
    description: 'Tự động hóa toàn bộ quy trình soạn bài, ra đề, kiểm duyệt nội dung. Trả lại thời gian cho giáo viên tập trung vào phương pháp sư phạm.'
  }
];

export function FeaturesSection() {
  return (
    <section className="landing-section">
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Được thiết kế để <span style={{ color: 'hsl(var(--primary))' }}>Giảm Tải Áp Lực</span>
        </h2>
        <p style={{ fontSize: '1.125rem', color: 'hsl(var(--muted-foreground))', maxWidth: '600px', margin: '0 auto' }}>
          Cung cấp bộ công cụ thông minh, tự động hóa mọi tác vụ soạn giảng và ra đề, giúp giáo viên tiết kiệm hàng giờ mỗi tuần.
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="feature-card"
          >
            <div className="feature-icon-wrapper">
              {feature.icon}
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-desc">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
