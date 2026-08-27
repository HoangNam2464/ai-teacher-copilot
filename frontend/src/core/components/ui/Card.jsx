import React from 'react';

export function Card({ children, hoverable = false, className = '', ...props }) {
  return (
    <div className={`card ${hoverable ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
