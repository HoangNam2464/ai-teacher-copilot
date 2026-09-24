import api from './api';

/**
 * Citation Service [FE-011]
 * Resolves source chunk IDs to document metadata, page numbers, and text excerpts.
 */
export const citationApi = {
  /**
   * Resolves chunk IDs to document references
   * @param {string} workspaceId - Workspace identifier
   * @param {string[]|string} chunkIds - Array or comma-separated list of chunk IDs
   * @returns {Promise<Array>} List of resolved citations
   */
  async resolveCitations(workspaceId, chunkIds) {
    if (!workspaceId || !chunkIds) return [];
    const ids = Array.isArray(chunkIds) ? chunkIds.filter(Boolean) : [chunkIds];
    if (ids.length === 0) return [];

    try {
      const response = await api.get(`/workspaces/${workspaceId}/citations/resolve`, {
        params: { chunkIds: ids.join(',') },
      });
      return response.data?.data || response.data || [];
    } catch (err) {
      console.warn('Backend citation resolution unavailable, using local grounding context:', err?.message);
      return [];
    }
  },
};

export default citationApi;
