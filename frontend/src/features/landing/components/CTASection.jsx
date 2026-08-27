import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PATHS } from '../../../app/routes/paths';
import { Button } from '../../../core/components/ui/Button';
import { ArrowRightIcon, SparklesIcon, CheckCircle2Icon } from '../../../core/components/ui/Icons';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-card">
          <div className="cta-glow-fx" aria-hidden="true" />

          <div className="cta-badge">
            <SparklesIcon size={14} />
            <span>{t('cta.badge')}</span>
          </div>

          <h2 className="cta-title">{t('cta.title')}</h2>

          <p className="cta-subtitle">
            {t('cta.subtitle')}
          </p>

          <div className="cta-actions">
            <Link to={PATHS.REGISTER}>
              <Button variant="default" size="lg" className="cta-btn">
                <span>{t('cta.button')}</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowRightIcon size={18} />
                </motion.span>
              </Button>
            </Link>
          </div>

          <div className="cta-guarantees">
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>{t('cta.guarantees.setup')}</span>
            </div>
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>{t('cta.guarantees.privacy')}</span>
            </div>
            <div className="guarantee-item">
              <CheckCircle2Icon size={14} />
              <span>{t('cta.guarantees.export')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
