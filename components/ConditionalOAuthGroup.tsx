import React from "react";
import { useSettings } from "../helpers/useSettingsApi";
import { OAuthButtonGroup } from "./OAuthButtonGroup";
import { Skeleton } from "./Skeleton";
import styles from "./ConditionalOAuthGroup.module.css";

interface ConditionalOAuthGroupProps {
  className?: string;
  disabled?: boolean;
}

/**
 * A component that conditionally renders OAuth authentication buttons
 * based on the 'oauth_enabled' system setting. It handles loading states
 * and gracefully renders nothing if the setting is disabled or not found.
 */
export const ConditionalOAuthGroup: React.FC<ConditionalOAuthGroupProps> = ({
  className,
  disabled,
}) => {
  const { data: oauthSetting, isFetching } = useSettings("oauth_enabled");

  if (isFetching) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <Skeleton className={styles.skeletonButton} />
      </div>
    );
  }

  // The setting value is stored in settingValue and is of type Json.
  // We explicitly check for `true` as the setting could be absent or have other JSON values.
  const isOauthEnabled = oauthSetting?.settingValue === true;

  if (!isOauthEnabled) {
    return null;
  }

  return (
    <>
      <div className={styles.separator}>
        <span className={styles.separatorText}>OR</span>
      </div>
      <OAuthButtonGroup className={className} disabled={disabled} />
    </>
  );
};