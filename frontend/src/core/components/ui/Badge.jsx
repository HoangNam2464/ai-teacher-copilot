import React from 'react';

export function Badge({ children, variant = 'neutral', className = '', ...props }) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
