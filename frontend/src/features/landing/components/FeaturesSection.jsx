import React from 'react';
import {
  BookOpenIcon,
  SparklesIcon,
  FileTextIcon,
  ShieldCheckIcon,
  CheckCircle2Icon,
} from '../../../core/components/ui/Icons';
import { BloomTaxonomyTag } from '../../../core/components/ui/BloomTaxonomyTag';

export function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="section-tag">Tính Năng Đột Phá</div>
          <h2 className="section-title">Hệ Thống Trợ Lý Sư Phạm Toàn Diện</h2>
          <p className="section-subtitle">
            Kết hợp sức mạnh trí tuệ nhân tạo tạo sinh (Generative AI) và công nghệ RAG đối soát tri thức,
            được tinh chỉnh chuyên sâu theo đặc thù giáo dục phổ thông Việt Nam.
          </p>
        </div>

        {/* Bento Grid Features */}
        <div className="bento-grid">
          {/* Bento Item 1 (Wide 2-col): Soạn Giáo Án 5512 */}
          <div className="bento-card bento-card--featured">
            <div className="bento-card-content">
              <div className="bento-icon-box">
                <BookOpenIcon size={26} />
              </div>
              <div className="bento-tag">Trọng tâm nghiệp vụ</div>
              <h3 className="bento-title">Kế Hoạch Bài Dạy Chuẩn Khung Công Văn 5512</h3>
              <p className="bento-desc">
                Tự động xây dựng tiến trình dạy học hoàn chỉnh theo 4 hoạt động sư phạm chuẩn mực:
                <strong> Khởi động</strong>, <strong>Hình thành kiến thức</strong>, <strong>Luyện tập</strong> và <strong>Vận dụng</strong>.
                Tích hợp rõ ràng bảng đối chiếu hoạt động giữa Thầy &amp; Trò, thiết bị dạy học và sản phẩm học tập tương ứng.
              </p>
              <div className="bento-feature-points">
                <div className="point-item">
                  <CheckCircle2Icon size={16} />
                  <span>Xác định đúng Chuẩn kiến thức, kỹ năng &amp; phẩm chất</span>
                </div>
                <div className="point-item">
                  <CheckCircle2Icon size={16} />
                  <span>Đa dạng hóa phương pháp: Dạy học dự án, Trạm, Bàn tay nặn bột</span>
                </div>
              </div>
            </div>
            <div className="bento-card-preview">
              <div className="preview-mini-table">
                <div className="preview-table-row preview-table-header">
                  <span>Hoạt động dạy học</span>
                  <span>Mục tiêu năng lực</span>
                  <span>Tiến trình</span>
                </div>
                <div className="preview-table-row">
                  <span className="p-tag p-tag--green">1. Khởi động</span>
                  <span>Tò mò khoa học</span>
                  <span>10 phút</span>
                </div>
                <div className="preview-table-row">
                  <span className="p-tag p-tag--teal">2. Khám phá</span>
                  <span>Mô hình hóa</span>
                  <span>25 phút</span>
                </div>
                <div className="preview-table-row">
                  <span className="p-tag p-tag--blue">3. Luyện tập</span>
                  <span>Giải quyết vấn đề</span>
                  <span>40 phút</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Item 2: RAG Grounding SGK */}
          <div className="bento-card">
            <div className="bento-icon-box">
              <ShieldCheckIcon size={24} />
            </div>
            <h3 className="bento-title">RAG Trích Dẫn SGK Minh Bạch</h3>
            <p className="bento-desc">
              Loại bỏ hoàn toàn tình trạng bịa đặt (hallucination). Mỗi mục tiêu và nội dung đều được đối soát và trích dẫn trực tiếp từ số trang sách giáo khoa gốc.
            </p>
            <div className="bento-mini-demo">
              <div className="citation-pill-demo">
                <span>📖 Nguồn: SGK Toán 10 Tr.45</span>
                <span className="conf-score">99% Match</span>
              </div>
            </div>
          </div>

          {/* Bento Item 3: Bloom Taxonomy Question Bank */}
          <div className="bento-card">
            <div className="bento-icon-box">
              <SparklesIcon size={24} />
            </div>
            <h3 className="bento-title">Ma Trận Đề &amp; Phân Loại Bloom</h3>
            <p className="bento-desc">
              Sinh câu hỏi trắc nghiệm &amp; tự luận phân tầng chuẩn xác theo thang Bloom (Nhận biết $\to$ Thông hiểu $\to$ Vận dụng $\to$ Vận dụng cao) có đáp án và ma trận xuất bản.
            </p>
            <div className="bento-mini-demo">
              <div className="bloom-tags-demo">
                <BloomTaxonomyTag level="Remember" />
                <BloomTaxonomyTag level="Understand" />
                <BloomTaxonomyTag level="Apply" />
                <BloomTaxonomyTag level="Analyze" />
              </div>
            </div>
          </div>

          {/* Bento Item 4: Word & PDF Export */}
          <div className="bento-card bento-card--full-width">
            <div className="bento-card-flex">
              <div className="bento-icon-box">
                <FileTextIcon size={26} />
              </div>
              <div className="bento-card-flex-body">
                <h3 className="bento-title">Xuất File Word (.docx) &amp; PDF Chuẩn Mực Sư Phạm</h3>
                <p className="bento-desc">
                  Tải về văn bản giáo án và đề thi được căn lề chuẩn 2-2-3-2 cm, bảng biểu rõ nét, chân trang trích dẫn hoàn chỉnh và công thức Toán học KaTeX hiển thị sắc sảo. Thầy cô chỉ việc in ấn hoặc nộp tổ chuyên môn ngay.
                </p>
              </div>
              <div className="bento-export-tags">
                <span className="export-pill">DOCX Word 2026</span>
                <span className="export-pill">Vector PDF</span>
                <span className="export-pill">KaTeX Math Formula</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
