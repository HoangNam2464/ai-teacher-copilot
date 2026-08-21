import React from 'react';
import { IconBookOpen } from '../icons/SvgIcons';

export function CitationBadge({ count = 0, onClick }) {
  if (!count || count === 0) return null;

  return (
    <button
      type="button"
      className="citation-badge"
      onClick={onClick}
      title="Xem nguồn trích dẫn học liệu (RAG Grounding)"
    >
      <IconBookOpen size={12} />
      <span>{count} trích dẫn</span>
    </button>
  );
}
