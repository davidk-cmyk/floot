import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '../components/Button';
import { Bot, CheckCircle2, UserCheck, BarChart3, ArrowRight } from 'lucide-react';
import styles from './_index.module.css';
import { useAuth } from '../helpers/useAuth';
import { useOrganization } from '../helpers/useOrganization';

const IndexPage = () => {
  const { authState } = useAuth();
  const { organizationState } = useOrganization();
  const navigate = useNavigate();

  // Redirect authenticated users to their org dashboard
  useEffect(() => {
    if (authState.type === 'authenticated' && organizationState.type === 'active') {
      const orgId = organizationState.currentOrganization.id;
      navigate(`/${orgId}/admin/dashboard`);
    }
  }, [authState, organizationState, navigate]);

  const heroButtonLink = authState.type === 'authenticated' && organizationState.type === 'active'
    ? `/${organizationState.currentOrganization.id}/admin/dashboard`
    : '/login';
  const heroButtonText = authState.type === 'authenticated' ? 'Go to Dashboard' : 'Get Started';

  const features = [
    {
      icon: <Bot size={32} />,
      title: 'AI-Powered Authoring',
      description: 'Generate, rewrite, and improve policies with our intelligent assistant, ensuring clarity and compliance.',
    },
    {
      icon: <CheckCircle2 size={32} />,
      title: 'Streamlined Approvals',
      description: 'Customize approval workflows to ensure policies are reviewed and signed off by the right people, every time.',
    },
    {
      icon: <UserCheck size={32} />,
      title: 'Acknowledgment Tracking',
      description: 'Distribute policies and track employee acknowledgments in real-time with automated reminders and detailed reports.',
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Powerful Analytics',
      description: 'Gain insights into policy engagement, compliance rates, and version history with a comprehensive analytics dashboard.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>MyPolicyPortal | Modern Policy Management</title>
        <meta
          name="description"
          content="The all-in-one platform for creating, managing, and tracking company policies. Powered by AI."
        />
      </Helmet>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              The new standard in policy management.
            </h1>
            <p className={styles.heroSubtitle}>
              MyPolicyPortal is a comprehensive platform that streamlines policy creation, distribution, and acknowledgment, all powered by AI.
            </p>
            <div className={styles.heroActions}>
              <Button asChild variant="ghost" size="lg">
                <Link to={heroButtonLink}>
                  {heroButtonText} <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
              alt="Professional working on a laptop"
              className={styles.heroImage}
            />
          </div>
        </section>

        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Everything you need, all in one place</h2>
            <p className={styles.sectionSubtitle}>
              From drafting to distribution, MyPolicyPortal simplifies every step of the policy lifecycle.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to transform your policy management?</h2>
            <p className={styles.ctaText}>
              Join leading organizations who trust MyPolicyPortal to ensure compliance and clarity.
            </p>
            <Button asChild size="lg">
              <Link to="/register-organization">
                Register organisation
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default IndexPage;