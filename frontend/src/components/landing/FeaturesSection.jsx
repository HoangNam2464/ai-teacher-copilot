import { motion } from 'framer-motion';
import {
  Upload,
  Brain,
  BookOpen,
  FileText,
  Download,
  Quote,
  Layers,
  Tag,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Upload,
    title: 'Upload & Xây dựng Kiến thức',
    description:
      'Upload PDF, DOCX lên Knowledge Base. AI tự động phân tích, phân đoạn và lập chỉ mục vector để truy xuất thông minh.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
  },
  {
    icon: Brain,
    title: 'Soạn Giáo Án AI',
    description:
      'AI truy xuất kiến thức từ tài liệu và tạo giáo án cấu trúc chuẩn: mục tiêu, hoạt động, đánh giá — tất cả bám sát chương trình.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-500/10 to-green-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: FileText,
    title: 'Tạo Đề Trắc Nghiệm',
    description:
      'Tự động tạo MCQ và câu hỏi tự luận theo từng cấp độ Bloom Taxonomy (Nhận biết → Sáng tạo) với đáp án và giải thích.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/10 to-amber-500/10',
    border: 'border-orange-500/20',
  },
  {
    icon: Tag,
    title: 'Bloom Taxonomy Tích Hợp',
    description:
      'Mỗi câu hỏi được tự động phân loại theo 6 cấp độ Bloom: Nhận biết, Hiểu, Áp dụng, Phân tích, Đánh giá, Sáng tạo.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    gradient: 'from-purple-500/10 to-violet-500/10',
    border: 'border-purple-500/20',
  },
  {
    icon: Quote,
    title: 'Trích Dẫn Nguồn Chính Xác',
    description:
      'Mọi nội dung được tạo ra đều kèm trích dẫn nguồn cụ thể: tên tài liệu, trang, đoạn văn — đảm bảo tính học thuật.',
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500/10 to-cyan-500/10',
    border: 'border-teal-500/20',
  },
  {
    icon: Download,
    title: 'Xuất Word & PDF',
    description:
      'Xuất giáo án và đề thi ra file Word (.docx) hoặc PDF chuyên nghiệp, sẵn sàng in ấn hoặc chia sẻ ngay lập tức.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    gradient: 'from-rose-500/10 to-pink-500/10',
    border: 'border-rose-500/20',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/30" />
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4">
            <Layers className="w-4 h-4" />
            Tính năng nổi bật
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Mọi thứ giáo viên cần trong{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              một nền tảng
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Từ quản lý tài liệu đến soạn bài và tạo đề thi — AI Teacher Copilot xử lý toàn bộ
            quy trình với độ chính xác học thuật cao.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className={cn(
                'group p-6 rounded-2xl border bg-gradient-to-br hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default',
                feature.gradient,
                feature.border
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110',
                  feature.bg
                )}
              >
                <feature.icon className={cn('w-6 h-6', feature.color)} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex items-center justify-center gap-3 text-sm text-muted-foreground"
        >
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Nội dung tài liệu được xử lý hoàn toàn riêng biệt theo từng Workspace — không có chia sẻ dữ
            liệu giữa các tài khoản.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
