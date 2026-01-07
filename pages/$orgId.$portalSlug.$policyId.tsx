import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useAuth } from '../helpers/useAuth';
import { usePortalPolicyDetails, usePortalPolicies } from '../helpers/usePortalApi';
import { useCheckEmailAcknowledgment } from '../helpers/useEmailAcknowledgmentApi';
import { useDocumentLayout } from '../helpers/useDocumentLayoutApi';
import { usePortalPassword } from '../helpers/usePortalPassword';
import { PortalSidebar, PortalView } from '../components/PortalSidebar';
import { PolicyActionsPanel } from '../components/PolicyActionsPanel';
import { PortalPolicyHeader } from '../components/PortalPolicyHeader';
import { PolicyViewTabs } from '../components/PolicyViewTabs';
import { PolicyAcknowledgmentBar } from '../components/PolicyAcknowledgmentBar';
import { PolicyAcknowledgmentCard } from '../components/PolicyAcknowledgmentCard';
import { EmailAcknowledgmentModal } from '../components/EmailAcknowledgmentModal';
import { PasswordPrompt } from '../components/PasswordPrompt';
import { Skeleton } from '../components/Skeleton';
import styles from "./$orgId.$portalSlug.$policyId.module.css";

const PolicyDetailSkeleton: React.FC = () => (
  <div className={styles.threeColumnLayout}>
    <aside className={styles.leftSidebar}>
      <Skeleton style={{ height: "2rem", width: "100%", marginBottom: "var(--spacing-4)" }} />
      <Skeleton style={{ height: "2.5rem", width: "100%" }} />
      <Skeleton style={{ height: "2.5rem", width: "100%" }} />
      <Skeleton style={{ height: "2.5rem", width: "100%" }} />
    </aside>
    <main className={styles.mainContent}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonBadges}>
          <Skeleton style={{ height: "1.5rem", width: "100px" }} />
          <Skeleton style={{ height: "1.5rem", width: "80px" }} />
        </div>
        <Skeleton style={{ height: "2rem", width: "70%" }} />
        <div className={styles.skeletonMeta}>
          <Skeleton style={{ height: "1rem", width: "150px" }} />
          <Skeleton style={{ height: "1rem", width: "200px" }} />
        </div>
      </div>
      <div className={styles.skeletonContent}>
        <Skeleton style={{ height: "1rem", width: "100%" }} />
        <Skeleton style={{ height: "1rem", width: "100%" }} />
        <Skeleton style={{ height: "1rem", width: "90%" }} />
      </div>
    </main>
    <aside className={styles.rightPanel}>
      <Skeleton style={{ height: "3rem", width: "100%", marginBottom: "var(--spacing-3)" }} />
      <Skeleton style={{ height: "2.5rem", width: "100%", marginBottom: "var(--spacing-3)" }} />
      <Skeleton style={{ height: "2.5rem", width: "100%" }} />
    </aside>
  </div>
);

const PortalPolicyDetailPage: React.FC = () => {
  const { orgId, portalSlug, policyId } = useParams<{orgId: string; portalSlug: string; policyId: string;}>();
  
  // Check if we're viewing a placeholder route in the editor
  if (portalSlug?.startsWith(':') || policyId?.startsWith(':') || orgId?.startsWith(':')) {
    return (
      <div className={styles.errorContainer}>
        <ShieldAlert size={48} className={styles.infoIcon} />
        <h1 className={styles.errorTitle}>Dynamic Policy Detail Page</h1>
        <p className={styles.errorMessage}>
          This is a dynamic page template. Navigate to an actual policy URL to see content.
        </p>
        <p className={styles.exampleText}>
          Example: <code>/123/public/123</code>
        </p>
      </div>
    );
  }
  
  const { password, setPassword } = usePortalPassword(portalSlug!);
  const [passwordError, setPasswordError] = useState<string>("");
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState<string | undefined>(() => 
    portalSlug ? sessionStorage.getItem(`visitor_email_${portalSlug}`) || undefined : undefined
  );
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  
  const { authState } = useAuth();

  const numericPolicyId = policyId ? parseInt(policyId, 10) : NaN;

  const { data, error, isFetching, isError } = usePortalPolicyDetails(
    portalSlug!,
    numericPolicyId,
    password
  );

  const { data: layoutSettings, isFetching: isLayoutSettingsLoading } = useDocumentLayout(
    data?.portal.id
  );

  // Fetch portal policies to get categories for sidebar
  const { data: portalPoliciesData } = usePortalPolicies(portalSlug!, {
    limit: 100,
    password: password,
  });

  // Check if visitor email has already acknowledged this policy
  const { data: emailAckData } = useCheckEmailAcknowledgment(
    portalSlug!,
    numericPolicyId,
    visitorEmail
  );

  console.log('[PortalPolicyDetail] Email acknowledgment check:', {
    portalSlug,
    policyId: numericPolicyId,
    visitorEmail,
    emailAckData,
  });

  const handlePasswordSubmit = (submittedPassword: string) => {
    setPasswordError("");
    setPassword(submittedPassword);
  };

  // Extract unique categories from portal policies
  const categories = React.useMemo(() => {
    if (!portalPoliciesData?.policies) return [];
    const uniqueCategories = new Set<string>();
    portalPoliciesData.policies.forEach(policy => {
      if (policy.category) {
        uniqueCategories.add(policy.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [portalPoliciesData]);

  const handleSidebarNavigate = (view: PortalView, category: string | null) => {
    // Navigate back to portal homepage with filters
    const searchParams = new URLSearchParams();
    if (view === 'favorites') {
      searchParams.set('view', 'favorites');
    } else if (view === 'recent') {
      searchParams.set('view', 'recent');
    } else if (category) {
      searchParams.set('category', category);
    }
    const queryString = searchParams.toString();
    window.location.href = `/${orgId}/${portalSlug}${queryString ? `?${queryString}` : ''}`;
  };

  if (!portalSlug || isNaN(numericPolicyId)) {
    return (
      <div className={styles.errorContainer}>
        <ShieldAlert size={48} className={styles.errorIcon} />
        <h1 className={styles.errorTitle}>Invalid URL</h1>
        <p className={styles.errorMessage}>The portal or policy ID is missing or invalid.</p>
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Go to Homepage
        </Link>
      </div>
    );
  }

  if (isFetching && !data) {
    return <PolicyDetailSkeleton />;
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    if (errorMessage.includes("Password required") || errorMessage.includes("Invalid password")) {
      const promptError = password 
        ? "The password you entered is incorrect. Please try again."
        : "This portal is password protected.";
      return (
        <PasswordPrompt
          portalName={data?.portal.name || portalSlug}
          onSubmit={handlePasswordSubmit}
          error={passwordError || promptError}
        />
      );
    }

    return (
      <div className={styles.errorContainer}>
        <ShieldAlert size={48} className={styles.errorIcon} />
        <h1 className={styles.errorTitle}>Access Denied or Not Found</h1>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <Link to={`/${orgId}/${portalSlug}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Portal
        </Link>
      </div>
    );
  }

  if (!data) {
    return null; // Should be covered by loading/error states
  }

  const { policy, portal, userAcknowledgmentStatus } = data;
  
  // Determine the acknowledgment mode
  const user = authState.type === 'authenticated' ? authState.user : null;
  const isAuthenticated = !!user;
  const requiresAcknowledgment = policy.requiresAcknowledgmentFromPortals;
  
  // Check if this is an email-based acknowledgment portal
  const isEmailBasedAcknowledgment = portal.accessType === 'password' && 
    portal.acknowledgmentMode === 'email' && 
    requiresAcknowledgment;
  
  console.log('[PortalPolicyDetail] Acknowledgment context:', {
    portalAccessType: portal.accessType,
    portalAckMode: portal.acknowledgmentMode,
    isEmailBasedAcknowledgment,
    isAuthenticated,
    requiresAcknowledgment,
    portalSlug,
    policyId: policy.id,
    visitorEmail,
  });

  // Determine acknowledgment status
  let isAcknowledged = false;
  let acknowledgedAt: Date | null = null;

  if (isAuthenticated) {
    // For authenticated users, use the userAcknowledgmentStatus from the API
    isAcknowledged = userAcknowledgmentStatus?.isAcknowledged ?? false;
    acknowledgedAt = userAcknowledgmentStatus?.acknowledgedAt ?? null;
  } else if (isEmailBasedAcknowledgment && visitorEmail && emailAckData?.success) {
    // For anonymous visitors with email verification
    isAcknowledged = emailAckData.isAcknowledged;
    acknowledgedAt = emailAckData.acknowledgedAt;
  }

  console.log('[PortalPolicyDetail] Acknowledgment status:', {
    isAcknowledged,
    acknowledgedAt,
    source: isAuthenticated ? 'authenticated' : 'email',
  });
  
  // Show acknowledgment bar if:
  // 1. Policy requires acknowledgment, AND
  // 2. Either user is authenticated OR portal uses email-based acknowledgment, AND
  // 3. Not yet acknowledged
  const showAcknowledgmentBar = requiresAcknowledgment && 
    (isAuthenticated || isEmailBasedAcknowledgment) &&
    !isAcknowledged;
  
  const handleAcknowledge = () => {
    console.log('[handleAcknowledge] Called');
    console.log('[handleAcknowledge] Portal context:', {
      portalSlug,
      portalAccessType: portal.accessType,
      portalAckMode: portal.acknowledgmentMode,
      policyId: policy?.id,
    });
    
    if (!policy) {
      console.warn('[handleAcknowledge] No policy available, aborting');
      return;
    }
    
    // Open email acknowledgment modal
    console.log('[handleAcknowledge] Opening email acknowledgment modal');
    setIsAckModalOpen(true);
  };

  const handleRemindLater = () => {
    // Navigate back to portal
    window.location.href = `/${orgId}/${portalSlug}`;
  };

  return (
    <>
      <Helmet>
        <title>{`${policy.title} - ${portal.name}`}</title>
        <meta name="description" content={`View the policy: ${policy.title} from the ${portal.name} portal.`} />
      </Helmet>
      
      <div className={styles.pageWrapper}>
        <div className={styles.threeColumnLayout}>
          {/* Left Sidebar */}
          <aside className={styles.leftSidebar}>
            <PortalSidebar
              categories={categories}
              activeView="all"
              activeCategory={null}
              onNavigate={handleSidebarNavigate}
            />
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            <Link to={`/${orgId}/${portalSlug}`} className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to {portal.name}
            </Link>
            
            <PortalPolicyHeader policy={policy} />
            
            <PolicyViewTabs
              policy={policy}
              layoutSettings={layoutSettings}
              isLayoutSettingsLoading={isLayoutSettingsLoading}
              contentContainerRef={contentContainerRef}
              showDocumentView={false}
              hideMetadataFields={['department', 'category', 'tags']}
            />
          </main>

          {/* Right Actions Panel */}
          <aside className={styles.rightPanel}>
            <PolicyAcknowledgmentCard
              policyTitle={policy.title}
              isVisible={showAcknowledgmentBar}
              isAcknowledging={false}
              onAcknowledge={handleAcknowledge}
              onReviewLater={handleRemindLater}
            />
            <PolicyActionsPanel
              policyId={policy.id}
              policyTitle={policy.title}
              policyContent={policy.content}
              portalSlug={portalSlug}
            />
          </aside>
        </div>
      </div>

      {/* Sticky Acknowledgment Bar - Mobile Only */}
      <PolicyAcknowledgmentBar
        policyTitle={policy.title}
        isVisible={showAcknowledgmentBar}
        isAcknowledging={false}
        onAcknowledge={handleAcknowledge}
        onRemindLater={handleRemindLater}
      />
      
      <EmailAcknowledgmentModal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        portalSlug={portalSlug}
        policyId={policy.id}
        policyTitle={policy.title}
        onSuccess={(email) => {
          console.log('[EmailAcknowledgmentModal] Success callback triggered with email:', email);
          setVisitorEmail(email);
          sessionStorage.setItem(`visitor_email_${portalSlug}`, email);
          setIsAckModalOpen(false);
        }}
      />
    </>
  );
};

export default PortalPolicyDetailPage;