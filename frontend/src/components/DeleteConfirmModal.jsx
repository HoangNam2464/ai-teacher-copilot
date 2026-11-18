import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const displayTitle = title || t('deleteConfirm.title', 'Xác nhận xóa');
  const displayDescription =
    description || t('deleteConfirm.description', 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <AlertDialogTitle>{displayTitle}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {displayDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('common.cancel', 'Hủy')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? t('common.deleting', 'Đang xóa...') : t('common.delete', 'Xóa')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
