import { motion } from 'framer-motion';
import { Upload, Search, Sparkles, Download, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Tài Liệu',
    description:
      'Tải lên tài liệu giảng dạy của bạn (PDF, DOCX). Hệ thống tự động phân tích cấu trúc, phân đoạn nội dung và lập chỉ mục vector.',
    details: ['PDF & DOCX', 'Phân tích tự động', 'Lập chỉ mục vector'],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    step: '02',
    icon: Search,
    title: 'RAG Retrieval Thông Minh',
    description:
      'Khi bạn yêu cầu AI tạo nội dung, hệ thống RAG tự động truy xuất những đoạn văn bản liên quan nhất từ tài liệu của bạn.',
    details: ['Tìm kiếm vector', 'Lọc theo Workspace', 'Xếp hạng liên quan'],
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'AI Tạo Nội Dung',
    description:
      'Gemini AI sử dụng nội dung truy xuất để tạo giáo án, đề trắc nghiệm, câu hỏi tự luận — tất cả đều chính xác, có cơ sở.',
    details: ['Giáo án cấu trúc', 'MCQ + Tự luận', 'Bloom Taxonomy'],
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    step: '04',
    icon: Download,
    title: 'Chỉnh Sửa & Xuất',
    description:
      'Giáo viên xem xét, chỉnh sửa nội dung AI tạo ra, sau đó xuất ra Word hoặc PDF chuyên nghiệp, sẵn sàng sử dụng.',
    details: ['Chỉnh sửa inline', 'Xuất Word/PDF', 'Lịch sử phiên bản'],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-500 to-green-500',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-medium mb-4">
            <ArrowRight className="w-4 h-4" />
            Cách hoạt động
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            4 bước từ tài liệu đến{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
              bài giảng hoàn chỉnh
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Quy trình đơn giản, minh bạch từ việc tải tài liệu lên đến khi có sản phẩm giảng dạy
            chất lượng cao trong tay.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6 lg:space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={cn(
                'flex flex-col lg:flex-row gap-6 lg:gap-12 items-center',
                index % 2 !== 0 && 'lg:flex-row-reverse'
              )}
            >
              {/* Content */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={cn('text-5xl font-black opacity-20', step.color)}>
                    {step.step}
                  </span>
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', step.bg)}>
                    <step.icon className={cn('w-5 h-5', step.color)} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  {step.details.map((detail) => (
                    <span
                      key={detail}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
                        step.bg,
                        step.border,
                        step.color
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {detail}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual Card */}
              <div className="flex-1 max-w-sm w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    'relative p-8 rounded-2xl border bg-gradient-to-br',
                    step.border,
                    `from-${step.gradient.split(' ')[1]}/5 to-${step.gradient.split(' ')[3]}/5`
                  )}
                >
                  <div
                    className={cn(
                      'w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto shadow-xl',
                      `${step.gradient}`
                    )}
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  >
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="mt-6 space-y-2">
                    {step.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className={cn('w-4 h-4 shrink-0', step.color)} />
                        {detail}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
