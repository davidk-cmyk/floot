import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ShieldCheck, Palette, Users, BarChart2, ArrowRight } from 'lucide-react';
import styles from './for-organizations.module.css';

const ForOrganizationsPage = () => {
  const features = [
    {
      icon: <ShieldCheck size={24} className={styles.featureIcon} />,
      title: 'Centralized Policy Management',
      description: 'A single source of truth for all your company policies, ensuring consistency and easy access.',
    },
    {
      icon: <Palette size={24} className={styles.featureIcon} />,
      title: 'Custom Branding',
      description: 'Customize your portal with your own logo, colors, and domain to match your corporate identity.',
    },
    {
      icon: <Users size={24} className={styles.featureIcon} />,
      title: 'User & Group Management',
      description: 'Assign roles and permissions, and distribute policies to specific departments or user groups.',
    },
    {
      icon: <BarChart2 size={24} className={styles.featureIcon} />,
      title: 'Acknowledgment Tracking',
      description: 'Monitor and report on policy acknowledgment to ensure compliance across your organization.',
    },
  ];

  return (
    <>
      <Helmet>
        <title>For Organizations | MyPolicyPortal</title>
        <meta
          name="description"
          content="Create a dedicated workspace for your team. Manage policies, track compliance, and customize your portal with MyPolicyPortal."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>A dedicated workspace for your organization</h1>
            <p className={styles.heroSubtitle}>
              Streamline policy management, ensure compliance, and provide a single source of truth for your entire team with a secure, branded portal.
            </p>
            <div className={styles.ctaContainer}>
              <Button asChild size="lg" className={styles.ctaButton}>
                <Link to="/register-organization">
                  Create Organization Account <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Everything you need to manage policies at scale</h2>
          <p className={styles.sectionSubtitle}>
            MyPolicyPortal provides powerful tools to simplify your compliance and communication workflows.
          </p>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                {feature.icon}
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Login Instructions Section */}
        <section className={styles.loginSection}>
          <div className={styles.loginCard}>
            <h2 className={styles.loginTitle}>Already have an organization?</h2>
            <p className={styles.loginDescription}>
              Access your dedicated login page using the unique URL slug you created during registration.
            </p>
            <div className={styles.urlExample}>
              <span>mypolicyportal.com/login/</span>
              <span className={styles.urlSlug}>your-org-name</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ForOrganizationsPage;