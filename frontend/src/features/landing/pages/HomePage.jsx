import React from 'react';
import { motion } from 'framer-motion';
import { AmbientBackground } from '../../../core/components/craft/AmbientBackground';
import {
  fullContainerVariants,
  fullItemVariants,
} from '../../../core/components/craft/motion-variants';
import {
  HeroSection,
  TrustedBySection,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
} from '../components';

/**
 * HomePage — Public Landing Page (Group B - Marketing Screen)
 * Implements full craft formula: Ambient Background, Motion Rhythm, Gradient Text.
 */
export function HomePage() {
  return (
    <div className="landing-page-root">
      {/* Full-intensity Ambient Background Blob Animation (Group B Standard) */}
      <AmbientBackground intensity="full" variant="primary" />

      {/* Main Page Content with Stagger Motion Rhythm */}
      <motion.div
        variants={fullContainerVariants}
        initial="hidden"
        animate="visible"
        className="landing-content-flow"
      >
        <motion.div variants={fullItemVariants}>
          <HeroSection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <TrustedBySection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <FeaturesSection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <HowItWorksSection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <TestimonialsSection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <FAQSection />
        </motion.div>

        <motion.div variants={fullItemVariants}>
          <CTASection />
        </motion.div>
      </motion.div>
    </div>
  );
}
