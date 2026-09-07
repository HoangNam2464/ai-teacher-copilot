import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Check, X, Loader2 } from 'lucide-react';
import { PATHS } from '@/routes/paths';

const EDUCATION_LEVEL_IDS = [
  'high_school',
  'undergraduate',
  'graduate',
  'post_graduate',
  'self_learner',
  'professional',
];

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const EDUCATION_LABELS = {
    high_school: t('profileEditPage.educationLevels.0', 'Trung học phổ thông'),
    undergraduate: t('profileEditPage.educationLevels.1', 'Đại học'),
    graduate: t('profileEditPage.educationLevels.2', 'Sau đại học'),
    post_graduate: t('profileEditPage.educationLevels.3', 'Nghiên cứu sinh'),
    self_learner: t('profileEditPage.educationLevels.4', 'Tự học'),
    professional: t('profileEditPage.educationLevels.5', 'Chuyên gia'),
  };
  
  // Safe fallback if translation doesn't return an array
  const commonSubjectsT = t('profileEditPage.commonSubjects', { returnObjects: true });
  const COMMON_SUBJECTS = Array.isArray(commonSubjectsT) ? commonSubjectsT : ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Văn học', 'Lịch sử', 'Tiếng Anh'];
  
  const { user } = useAuthStore();
  
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [customSubject, setCustomSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Mock loading profile data
    const loadProfile = async () => {
      setName(user?.displayName || '');
      setAvatarUrl(user?.avatarUrl || '');
      // Mock some data for the demo since backend is not fully integrated for this
      setEducationLevel('professional');
      setSubjects(['Toán học', 'Vật lý']);
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      // Mock API call
      await new Promise(r => setTimeout(r, 1000));
    } catch {
      setUploadError(t('profileEditPage.uploadFailed', 'Failed to upload image. Please try again.'));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    setSaving(true);
    try {
      // Mock API call
      await new Promise(r => setTimeout(r, 1500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently ignore save errors for demo
    }
    setSaving(false);
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
            {t('profileEditPage.back', 'Quay lại')}
          </Button>
          <h1 className="text-2xl font-bold">{t('profileEditPage.title', 'Chỉnh sửa hồ sơ')}</h1>
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
                    <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover" />
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
          <label className="block text-sm font-medium mb-2">{t('profileEditPage.displayName', 'Tên hiển thị')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('profileEditPage.namePlaceholder', 'Tên của bạn')}
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
          <label className="block text-sm font-medium mb-2">{t('profileEditPage.email', 'Email')}</label>
          <input
            value={user?.email || 'user@example.com'}
            readOnly
            className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-2">{t('profileEditPage.emailCannotBeChanged', 'Không thể thay đổi email.')}</p>
        </motion.div>

        {/* Education Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border p-6 mb-6"
        >
          <label className="block text-sm font-medium mb-3">{t('profileEditPage.educationLevel', 'Cấp độ giảng dạy')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EDUCATION_LEVEL_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setEducationLevel(educationLevel === id ? '' : id)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  educationLevel === id
                    ? 'border-primary/50 bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                }`}
              >
                {EDUCATION_LABELS[id] || id}
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
          <label className="block text-sm font-medium mb-3">{t('profileEditPage.subjectsOfInterest', 'Môn học giảng dạy')}</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {COMMON_SUBJECTS.map((subject) => {
              const selected = subjects.includes(subject);
              return (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  {subject}
                  {selected && <X className="w-3 h-3 ml-1 inline" />}
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
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/50 bg-primary/10 text-primary flex items-center gap-1"
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
              onKeyDown={(e) => e.key === 'Enter' && addCustomSubject()}
              placeholder={t('profileEditPage.addCustomSubject', 'Thêm môn học khác')}
              className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button size="sm" variant="outline" onClick={addCustomSubject} disabled={!customSubject.trim()}>
              {t('profileEditPage.add', 'Thêm')}
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
            className="w-full h-12"
          >
            {saving ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : saved ? (
              <Check className="w-5 h-5 mr-2" />
            ) : null}
            {saving ? t('profileEditPage.saving', 'Đang lưu...') : saved ? t('profileEditPage.saved', 'Đã lưu!') : t('profileEditPage.saveChanges', 'Lưu thay đổi')}
          </Button>
        </motion.div>
      </div>
  );
}
