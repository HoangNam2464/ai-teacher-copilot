import React from 'react';
import { useTranslation } from 'react-i18next';

export function TrustedBySection() {
  const { t } = useTranslation();

  const stats = [
    { value: t('trustedBy.teachersCount'), label: t('trustedBy.teachersLabel') },
    { value: t('trustedBy.standardsRate'), label: t('trustedBy.standardsLabel') },
    { value: t('trustedBy.timeSavedRate'), label: t('trustedBy.timeSavedLabel') },
    { value: t('trustedBy.provincesCount'), label: t('trustedBy.provincesLabel') },
  ];

  return (
    <section className="trusted-by-section">
      <div className="trusted-by-container">
        <p className="trusted-by-title">{t('trustedBy.title')}</p>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
