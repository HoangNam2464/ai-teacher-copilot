import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'AI Teacher Copilot sử dụng AI như thế nào để tạo nội dung?',
    answer:
      'Chúng tôi sử dụng kiến trúc RAG (Retrieval-Augmented Generation). Khi bạn yêu cầu tạo giáo án hoặc đề thi, hệ thống sẽ tìm kiếm các đoạn văn bản liên quan nhất từ tài liệu của bạn (đã được lập chỉ mục vector), sau đó cung cấp cho Gemini AI như một ngữ cảnh đáng tin cậy để tạo ra nội dung chính xác và có căn cứ.',
  },
  {
    question: 'Tài liệu của tôi có được chia sẻ với người khác không?',
    answer:
      'Hoàn toàn không. Mỗi Workspace là một môi trường hoàn toàn riêng biệt. Tài liệu của bạn chỉ được sử dụng trong phạm vi Workspace của bạn. Hệ thống áp dụng kiểm soát truy cập nghiêm ngặt — không có dữ liệu nào được chia sẻ giữa các tài khoản.',
  },
  {
    question: 'Tôi có thể upload những loại tài liệu nào?',
    answer:
      'Hiện tại hỗ trợ PDF và DOCX. Bạn có thể upload sách giáo khoa, tài liệu tham khảo, giáo án cũ, đề thi mẫu, hay bất kỳ tài liệu học thuật nào. Hệ thống sẽ tự động phân tích cấu trúc và nội dung.',
  },
  {
    question: 'Bloom Taxonomy được tích hợp như thế nào?',
    answer:
      'Mỗi câu hỏi trắc nghiệm và tự luận được tự động phân loại theo 6 cấp độ Bloom: Nhận biết (Remember), Hiểu (Understand), Áp dụng (Apply), Phân tích (Analyze), Đánh giá (Evaluate), và Sáng tạo (Create). Điều này giúp đảm bảo đề thi của bạn phân bổ đúng các cấp độ tư duy.',
  },
  {
    question: 'Trích dẫn nguồn hoạt động như thế nào?',
    answer:
      'Mỗi ý tưởng, luận điểm hay nội dung trong giáo án và đề thi đều được kèm mã định danh chunk nguồn. Giáo viên có thể xem ngay đoạn văn bản gốc từ tài liệu đã upload tương ứng với nội dung đó, đảm bảo tính học thuật và minh bạch.',
  },
  {
    question: 'Tôi có thể chỉnh sửa nội dung AI tạo ra không?',
    answer:
      'Có. AI chỉ tạo ra bản nháp ban đầu. Giáo viên có toàn quyền xem xét, chỉnh sửa, bổ sung hoặc xóa bỏ bất kỳ nội dung nào. Bạn cũng có thể yêu cầu AI tạo lại với hướng dẫn cụ thể hơn. Mọi thay đổi đều được lưu lịch sử phiên bản.',
  },
];

function FAQItem({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border border-border/50 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium pr-4">{faq.question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-muted-foreground leading-relaxed text-sm border-t border-border/50 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-muted/20" />
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
            <HelpCircle className="w-4 h-4" />
            Câu hỏi thường gặp
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Những thắc mắc phổ biến
          </h2>
          <p className="text-muted-foreground">
            Không tìm thấy câu trả lời? Hãy liên hệ với chúng tôi.
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
