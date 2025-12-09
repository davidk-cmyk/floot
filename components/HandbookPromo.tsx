import React from "react";
import { BookOpen, FileText, Users, Globe, Sparkles, Bell } from "lucide-react";
import styles from "./HandbookPromo.module.css";

interface HandbookPromoProps {
  primaryColor?: string;
}

export const HandbookPromo: React.FC<HandbookPromoProps> = ({ primaryColor }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper} style={primaryColor ? { background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 70%, #6366f1) 100%)` } : undefined}>
          <BookOpen size={32} />
        </div>
        <div className={styles.badge}>
          <Sparkles size={14} />
          Coming Soon
        </div>
      </div>

      <h1 className={styles.title}>Handbook Generator</h1>
      <p className={styles.subtitle}>Transform your policies into professional handbooks</p>

      <div className={styles.description}>
        <p>
          Automatically compile your policies into cohesive, professionally formatted handbooks 
          ready for distribution to employees, clients, or partners.
        </p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Users size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>Internal Handbooks</h3>
            <p>Create employee handbooks with HR policies, conduct guidelines, and operational procedures.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <Globe size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>External Handbooks</h3>
            <p>Generate client-facing guides with privacy policies, terms of service, and compliance documentation.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <FileText size={20} />
          </div>
          <div className={styles.featureContent}>
            <h3>AI-Powered Formatting</h3>
            <p>Intelligent organization and formatting ensures your handbooks are clear, consistent, and professional.</p>
          </div>
        </div>
      </div>

      <div className={styles.cta}>
        <button className={styles.notifyButton} disabled>
          <Bell size={16} />
          Notify Me When Available
        </button>
        <p className={styles.ctaNote}>We'll let you know as soon as this feature launches.</p>
      </div>
    </div>
  );
};
