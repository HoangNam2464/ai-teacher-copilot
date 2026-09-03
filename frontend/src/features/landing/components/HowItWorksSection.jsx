import React from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Zap, FileOutput } from 'lucide-react';

const steps = [
  {
    icon: <UploadCloud size={32} />,
    title: '1. Tải lên tài liệu của bạn',
    description: 'Tạo không gian làm việc (Workspace) và tải lên các file PDF, DOCX (SGK, sách chuyên đề, đề cương ôn tập). AI sẽ tự động phân tích và tạo Knowledge Base.',
  },
  {
    icon: <Zap size={32} />,
    title: '2. Yêu cầu AI soạn bài',
    description: 'Chọn loại tài liệu muốn tạo (Giáo án, Trắc nghiệm, Câu hỏi tự luận) và nhập mô tả hoặc yêu cầu cụ thể. AI Copilot sẽ tự động tra cứu Knowledge Base và sinh ra nội dung.',
  },
  {
    icon: <FileOutput size={32} />,
    title: '3. Kiểm duyệt và Xuất file',
    description: 'Giáo viên kiểm tra lại nội dung do AI tạo ra, có thể chỉnh sửa trực tiếp hoặc yêu cầu AI sửa đổi. Sau khi hoàn tất, xuất file Word hoặc PDF với định dạng chuẩn.',
  }
];

export function HowItWorksSection() {
  return (
    <section className="landing-section">
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Quy trình làm việc</h2>
        <p style={{ fontSize: '1.125rem', color: 'hsl(var(--muted-foreground))' }}>3 bước đơn giản để tự động hóa công việc sư phạm</p>
      </div>

      <div className="steps-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
            className="step-item"
          >
            <div className="step-number">
              {idx + 1}
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
