import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportService } from '@/services/export';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Download, ChevronDown, FileText } from 'lucide-react';

export function ExportDropdown({ workspaceId, generationId, defaultFileName = 'tai-lieu' }) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format) => {
    if (!workspaceId || !generationId) return;
    try {
      setIsExporting(true);
      await exportService.exportDocument(workspaceId, generationId, format, defaultFileName);
      toast.success(t('common.success', 'Đang tải xuống tài liệu...'));
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(t('export.failed', 'Xuất tài liệu thất bại. Vui lòng thử lại.'));
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-1.5 text-xs font-medium border-border hover:bg-muted"
      >
        {isExporting ? (
          <Spinner className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Download className="w-3.5 h-3.5 text-green-600" />
        )}
        <span>{t('export.button', 'Xuất file')}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-fade-in">
            <button
              type="button"
              onClick={() => handleExport('DOCX')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold">{t('export.word', 'File Word (.docx)')}</p>
                <p className="text-[10px] text-muted-foreground">Kèm trích dẫn nguồn</p>
              </div>
            </button>

            <div className="border-t border-border my-1" />

            <button
              type="button"
              onClick={() => handleExport('PDF')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center text-red-600 flex-shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold">{t('export.pdf', 'File PDF (.pdf)')}</p>
                <p className="text-[10px] text-muted-foreground">Sẵn sàng in ấn</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
