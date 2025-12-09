import React from "react";
import { HelpCircle, FileText, Layers, Sliders, Sparkles } from "lucide-react";
import styles from "./FaqPromo.module.css";

interface FaqPromoProps {
  primaryColor?: string;
}

export const FaqPromo: React.FC<FaqPromoProps> = ({ primaryColor }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} style={primaryColor ? { background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 70%, #6366f1) 100%)` } : undefined}>
          <HelpCircle size={32} />
        </div>
        <div className={styles.badge}>
          <Sparkles size={14} />
          Coming Soon
        </div>
      </div>

      <h1 className={styles.title}>FAQ Generator</h1>
      <p className={styles.subtitle}>Turn your policies into searchable Q&A</p>

      <div className={styles.description}>
        <p>
          Automatically generate comprehensive FAQ documents by analyzing your policies.
          Help employees and users quickly find answers without reading entire policy documents.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <FileText size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Policy-Based FAQs</h3>
            <p>AI analyzes your policies to extract key information and formulate common questions with clear answers.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Layers size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Multi-Policy Support</h3>
            <p>Combine multiple policies into unified FAQ documents with cross-referenced answers for comprehensive coverage.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Sliders size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Customizable Output</h3>
            <p>Choose question categories and topics to focus on, then edit and refine AI-generated content before publishing.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
