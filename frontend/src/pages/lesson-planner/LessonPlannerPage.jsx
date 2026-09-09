import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { lessonPlannerApi } from '@/services/generation';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CitationBadge } from '@/components/citation/CitationBadge';
import { CitationDrawer } from '@/components/citation/CitationDrawer';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { Wand2, Target, Clock, BookOpen, AlertCircle } from 'lucide-react';

export function LessonPlannerPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Citation Drawer State
  const [isCitationOpen, setIsCitationOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?.id) {
      alert(t('workspace.selectFirst'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const payload = {
        subject: activeWorkspace.subject || t('common.defaultSubject'),
        gradeLevel: activeWorkspace.gradeLevel || t('common.defaultGrade'),
        topic,
        objectives: objectives ? objectives.split('\n').filter((s) => s.trim()) : [],
        durationMinutes: Number(durationMinutes),
        instructions,
      };

      const data = await lessonPlannerApi.generateLessonPlan(activeWorkspace.id, payload);
      setResult(data);
    } catch (err) {
      console.error('Generation failed:', err);
      if (err.response?.status === 422) {
        setError(t('lessonPlanner.insufficientEvidence'));
      } else {
        setError(err.response?.data?.message || t('lessonPlanner.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const plan = result?.contentData || result?.lessonPlan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('lessonPlanner.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('lessonPlanner.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Input Form */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              {t('lessonPlanner.formTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('lessonPlanner.topic')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t('lessonPlanner.topicPlaceholder')}
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('workspace.subject')}</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-muted pl-9 pr-3 py-2 text-sm text-muted-foreground cursor-not-allowed placeholder:text-muted-foreground/50"
                      disabled
                      placeholder={t('lessonPlanner.selectWorkspaceFirst')}
                      value={activeWorkspace?.subject || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('lessonPlanner.duration')}</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      min={15}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('lessonPlanner.objectives')}</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={3}
                  placeholder={t('lessonPlanner.objectivesPlaceholder')}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('lessonPlanner.instructions')}</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={2}
                  placeholder={t('lessonPlanner.instructionsPlaceholder')}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-11 gap-2 text-base font-medium">
                <Wand2 className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? t('lessonPlanner.generating') : t('lessonPlanner.generate')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Output Preview */}
        {result && plan ? (
          <div className="sticky top-24 h-fit">
            <Card className="overflow-hidden border-emerald-500/20 shadow-md shadow-emerald-500/5">
              <CardHeader className="bg-emerald-50/50 dark:bg-emerald-500/5 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-emerald-700 dark:text-emerald-400">
                      {plan.title || topic}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {t('lessonPlanner.durationLabel')}: {plan.duration_minutes || durationMinutes} {t('lessonPlanner.durationUnit')} • {activeWorkspace?.gradeLevel}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <CitationBadge
                      count={plan.source_chunk_ids?.length || 0}
                      onClick={() => setIsCitationOpen(true)}
                    />
                    <ExportDropdown
                      workspaceId={activeWorkspace?.id}
                      generationId={result.id}
                      defaultFileName={`giao-an-${topic}`}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 overflow-y-auto max-h-[calc(100vh-16rem)]">
                {plan.objectives && plan.objectives.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      {t('lessonPlanner.objectivesTitle')}
                    </h4>
                    <ul className="space-y-1.5 pl-6 list-disc text-sm text-muted-foreground">
                      {plan.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.sections && plan.sections.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      {t('lessonPlanner.activitiesTitle')}
                    </h4>
                    <div className="space-y-4">
                      {plan.sections.map((sec, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-muted/50 border border-border/50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <strong className="text-sm font-medium">{sec.title}</strong>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md whitespace-nowrap">
                              {sec.duration_minutes} {t('lessonPlanner.durationUnit')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {sec.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <CitationDrawer
              isOpen={isCitationOpen}
              onClose={() => setIsCitationOpen(false)}
              citations={plan.source_chunk_ids?.map((id) => ({
                chunkId: id,
                fileName: t('citation.sourceDoc'),
                excerpt: t('lessonPlanner.chunkExcerpt')
              }))}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center bg-muted/20 border-2 border-dashed border-border rounded-2xl h-[calc(100vh-16rem)] sticky top-24">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-emerald-500 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('lessonPlanner.emptyTitle')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t('lessonPlanner.emptyDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
