/**
 * Utility for persisting and restoring lesson plan drafts in localStorage.
 * Guarantees that teacher edits and generated plans are never lost upon page refresh.
 */

const STORAGE_PREFIX = 'ai_copilot_lesson_draft_';

export const lessonStorage = {
  /**
   * Save the lesson plan draft and associated form inputs.
   * @param {string} workspaceId
   * @param {Object} data - { result, plan, form }
   */
  saveDraft(workspaceId, { result, plan, form }) {
    if (!workspaceId) return;
    try {
      const payload = {
        result,
        plan,
        form: form || {},
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}${workspaceId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save lesson draft to localStorage:', e);
    }
  },

  /**
   * Retrieve the saved lesson plan draft for a workspace.
   * @param {string} workspaceId
   * @returns {Object|null}
   */
  getDraft(workspaceId) {
    if (!workspaceId) return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${workspaceId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse lesson draft from localStorage:', e);
      return null;
    }
  },

  /**
   * Remove the saved draft for a workspace.
   * @param {string} workspaceId
   */
  clearDraft(workspaceId) {
    if (!workspaceId) return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${workspaceId}`);
    } catch (e) {
      console.warn('Failed to clear lesson draft from localStorage:', e);
    }
  },
};
