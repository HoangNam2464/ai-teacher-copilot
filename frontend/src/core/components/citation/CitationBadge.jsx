import React from 'react';
import { BookOpenIcon } from '../ui/Icons';

export function CitationBadge({ count = 0, onClick }) {
  if (!count || count === 0) return null;

  return (
    <button
      type="button"
      className="citation-badge"
      onClick={onClick}
      title="Xem nguồn trích dẫn học liệu"
    >
      <BookOpenIcon size={12} />
      <span>{count} nguồn</span>
    </button>
  );
}

