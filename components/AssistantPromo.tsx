import React from "react";
import { MessageCircleQuestion, Zap, ShieldCheck, Globe, Sparkles } from "lucide-react";
import styles from "./AssistantPromo.module.css";

interface AssistantPromoProps {
  primaryColor?: string;
}

export const AssistantPromo: React.FC<AssistantPromoProps> = ({ primaryColor }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} style={primaryColor ? { background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 70%, #6366f1) 100%)` } : undefined}>
          <MessageCircleQuestion size={32} />
        </div>
        <div className={styles.badge}>
          <Sparkles size={14} />
          Coming Soon
        </div>
      </div>

      <h1 className={styles.title}>Policy Assistant</h1>
      <p className={styles.subtitle}>AI-powered answers for your portal visitors</p>

      <div className={styles.description}>
        <p>
          Give your portal visitors instant answers to their policy questions.
          The Policy Assistant provides accurate, cited responses grounded entirely in your published policies.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Zap size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Instant Answers</h3>
            <p>Real-time responses to user questions, available 24/7. No more searching through lengthy documents.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Grounded in Your Policies</h3>
            <p>All answers cite specific policy sources. Factual responses based only on your published content.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Globe size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Portal Integration</h3>
            <p>Seamlessly embedded in your public and internal portals, matching your branding and design.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
