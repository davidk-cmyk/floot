import React from "react";
import { Link } from "react-router-dom";
import { Building2, FileText, Send, ArrowRight, Sparkles } from "lucide-react";
import { useOrgNavigation } from "../helpers/useOrgNavigation";
import { Button } from "./Button";
import styles from "./DashboardOnboarding.module.css";

// Minimal interface for stats based on typical dashboard requirements
interface DashboardStats {
  totalPolicies?: number;
  requiresAcknowledgement?: number;
  [key: string]: any;
}

interface DashboardOnboardingProps {
  stats?: DashboardStats;
  isFirstTimeUser?: boolean;
  className?: string;
}

export const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({
  stats,
  isFirstTimeUser = false,
  className,
}) => {
  const { buildUrl } = useOrgNavigation();

  // Determine if we should show the welcome variant or the compact quick actions variant
  // We show the welcome variant if it's the first time user
  // We show the compact variant if it's not first time, but they might still need quick actions
  const isWelcomeMode = isFirstTimeUser;

  // If not first time user and they have policies/portals, we might want to hide this
  // or show it as a permanent "Quick Actions" bar.
  // Based on requirements: "For returning users with incomplete setup, make it more subtle"
  // We'll treat it as "Quick Actions" if not welcome mode.

    const steps = [
    {
      id: "portal",
      title: "Create a Portal",
      description: "Set up a branded portal to host and distribute your policies publicly or internally.",
      icon: Building2,
      href: "/admin/settings/portals",
      cta: "Go to Portals",
      isComplete: false, // We don't track portal count in stats currently
    },
    {
      id: "policy",
      title: "Create & Publish Policy",
      description: "Draft a new policy using our AI assistant or upload your existing documents.",
      icon: FileText,
      href: "/admin/policies/create",
      cta: "Draft Policy",
      isComplete: (stats?.totalPolicies || 0) > 0,
    },
    {
      id: "review",
      title: "Send for Review",
      description: "Track user acknowledgements, view pending tasks, and copy portal links to share.",
      icon: Send,
      href: "/admin/acknowledgements",
      cta: "View Acknowledgements",
      isComplete: (stats?.requiresAcknowledgement || 0) > 0,
    },
  ];

  return (
    <div
      className={`
        ${styles.container} 
        ${isWelcomeMode ? styles.welcomeMode : styles.compactMode}
        ${className || ""}
      `}
    >
      <div className={styles.header}>
        {isWelcomeMode ? (
          <>
            <div className={styles.welcomeIcon}>
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className={styles.title}>Get Started with MyPolicyPortal</h2>
              <p className={styles.subtitle}>
                Follow these steps to set up your organization's policy management system.
              </p>
            </div>
          </>
        ) : (
          <h3 className={styles.compactTitle}>Quick Actions</h3>
        )}
      </div>

      <div className={styles.grid}>
        {steps.map((step) => (
          <div
            key={step.id}
            className={`${styles.card} ${step.isComplete && isWelcomeMode ? styles.completedCard : ""}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>
                <step.icon size={24} />
              </div>
              {isWelcomeMode && step.isComplete && (
                <span className={styles.completedBadge}>Completed</span>
              )}
            </div>
            
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardDescription}>{step.description}</p>
            </div>

            <div className={styles.cardFooter}>
              <Button asChild variant="outline" size="sm" className={styles.actionButton}>
                <Link to={buildUrl(step.href)}>
                  {step.cta} <ArrowRight size={14} className={styles.arrowIcon} />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};