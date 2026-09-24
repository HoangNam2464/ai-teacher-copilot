import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ExportModal } from './ExportModal';
import { Download, FileDown } from 'lucide-react';

/**
 * Export button that launches the Document Export Modal.
 */
export function ExportDropdown({
  workspaceId,
  generationId,
  defaultFileName = 'giao-an-bai-day',
  planData = null,
  subject = '',
  gradeLevel = '',
  variant = 'outline',
  size = 'sm',
  className = '',
}) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 text-xs font-medium border-border hover:bg-muted ${className}`}
        title={t('export.modalTitle', 'Xuất Tài Liệu Bài Dạy')}
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        <span>{t('export.button', 'Xuất tài liệu')}</span>
      </Button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspaceId}
        generationId={generationId}
        defaultFileName={defaultFileName}
        planData={planData}
        subject={subject}
        gradeLevel={gradeLevel}
      />
    </>
  );
}

export default ExportDropdown;
