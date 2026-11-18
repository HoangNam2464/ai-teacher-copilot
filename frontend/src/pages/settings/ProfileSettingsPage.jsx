import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/user';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, X, Loader2 } from 'lucide-react';
import { PATHS } from '@/routes/paths';

// Strict K-12 educational levels (Lớp 1 đến Lớp 12)
const EDUCATION_LEVEL_IDS = [
  'elementary',
  'middle_school',
  'high_school',
];

const EDUCATION_LABELS = {
  elementary: 'Tiểu học (Lớp 1 – 5)',
  middle_school: 'THCS (Lớp 6 – 9)',
  high_school: 'THPT (Lớp 10 – 12)',
};

// 12 Standard Vietnamese K-12 Subjects
const COMMON_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'GDCD',
  'Âm nhạc',
  'Mỹ thuật',
];

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [educationLevel, setEducationLevel] = useState('high_school');
  const [subjects, setSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await userService.getProfile();
        const profile = res?.data || res;
        setName(profile.fullName || user?.displayName || user?.name || '');
        setAvatarUrl(profile.avatarUrl || user?.avatarUrl || '');
        setEducationLevel(profile.educationLevel || 'high_school');

        let loadedSubjects = [];
        if (profile.subjects) {
          try {
            loadedSubjects = typeof profile.subjects === 'string' ? JSON.parse(profile.subjects) : profile.subjects;
          } catch {
            loadedSubjects = profile.subjects.split(',').map((s) => s.trim());
          }
        }
        setSubjects(Array.isArray(loadedSubjects) && loadedSubjects.length > 0 ? loadedSubjects : ['Toán học']);
      } catch (err) {
        console.warn('Failed to load profile from API, using store fallback:', err);
        setName(user?.displayName || user?.name || user?.fullName || '');
        setAvatarUrl(user?.avatarUrl || '');
        setEducationLevel(user?.educationLevel || 'high_school');
        setSubjects(['Toán học']);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ảnh đại diện không được vượt quá 2MB');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setAvatarUrl(dataUrl);
    } catch {
      setUploadError(t('profileEditPage.uploadFailed', 'Tải ảnh thất bại. Vui lòng thử lại.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleSubject = (subject) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject],
    );
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await userService.updateProfile({
        fullName: name.trim(),
        avatarUrl: avatarUrl || null,
        educationLevel: educationLevel || 'high_school',
        subjects: JSON.stringify(subjects),
      });
      const updated = res?.data || res;
      updateUser({
        fullName: updated.fullName,
        name: updated.fullName,
        avatarUrl: updated.avatarUrl,
        educationLevel: updated.educationLevel,
        subjects: updated.subjects,
      });
      setSaved(true);
      toast.success(t('profileEditPage.saveSuccess', { defaultValue: 'Cập nhật hồ sơ thành công!' }));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Cập nhật hồ sơ thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate(PATHS.SETTINGS.ROOT)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('profileEditPage.back')}
        </Button>
        <h1 className="text-2xl font-bold">{t('profileEditPage.title')}</h1>
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex justify-center mb-8"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-background shadow-md">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-24 h-24 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {name.charAt(0).toUpperCase() || 'T'}
                  </span>
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          {uploadError && (
            <p className="text-xs text-destructive text-center mt-2">{uploadError}</p>
          )}
        </div>
      </motion.div>

      {/* Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <label className="block text-sm font-medium mb-2">{t('profileEditPage.displayName')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profileEditPage.namePlaceholder')}
          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </motion.div>

      {/* Email (read-only) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <label className="block text-sm font-medium mb-2">{t('profileEditPage.email')}</label>
        <input
          value={user?.email || 'user@example.com'}
          readOnly
          className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-2">{t('profileEditPage.emailCannotBeChanged')}</p>
      </motion.div>

      {/* Education Level (K-12 only) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <label className="block text-sm font-medium mb-1">Cấp bậc giảng dạy (K-12)</label>
        <p className="text-xs text-muted-foreground mb-4">
          Hỗ trợ tùy biến giáo án và bài tập chuẩn GDPT từ Lớp 1 đến Lớp 12
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EDUCATION_LEVEL_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setEducationLevel(id)}
              className={`p-3.5 rounded-xl border text-sm font-medium text-left transition-all ${
                educationLevel === id
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{EDUCATION_LABELS[id]}</span>
                {educationLevel === id && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-xs text-muted-foreground block">
                {id === 'elementary' && 'Học sinh từ Lớp 1 đến Lớp 5'}
                {id === 'middle_school' && 'Học sinh từ Lớp 6 đến Lớp 9'}
                {id === 'high_school' && 'Học sinh từ Lớp 10 đến Lớp 12'}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Subjects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <label className="block text-sm font-medium mb-1">Môn học phụ trách</label>
        <p className="text-xs text-muted-foreground mb-4">
          Chọn các môn bạn giảng dạy để AI tối ưu hóa nội dung giáo án và câu hỏi
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {COMMON_SUBJECTS.map((subject) => {
            const selected = subjects.includes(subject);
            return (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {subject}
                {selected && <X className="w-3 h-3 ml-1.5 inline" />}
              </button>
            );
          })}
        </div>

        {/* Custom subjects */}
        {subjects.filter((s) => !COMMON_SUBJECTS.includes(s)).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {subjects
              .filter((s) => !COMMON_SUBJECTS.includes(s))
              .map((s) => (
                <span
                  key={s}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                >
                  {s}
                  <button onClick={() => toggleSubject(s)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSubject();
              }
            }}
            placeholder="Nhập môn học khác (Enter)..."
            className="flex-1 px-3.5 py-2 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <Button size="sm" variant="outline" onClick={addCustomSubject} disabled={!customSubject.trim()}>
            {t('profileEditPage.add')}
          </Button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {saving ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : saved ? (
            <Check className="w-5 h-5 mr-2" />
          ) : null}
          {saving ? t('profileEditPage.saving') : saved ? t('profileEditPage.saved') : t('profileEditPage.saveChanges')}
        </Button>
      </motion.div>
    </div>
  );
}
