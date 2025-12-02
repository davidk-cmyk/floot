import React from "react";
import {
  useSettings,
  useUpdateSettings,
} from "../helpers/useSettingsApi";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import styles from "./SettingsBooleanManager.module.css";

interface SettingsBooleanManagerProps {
  title: string;
  description: string;
  settingKey: string;
  enabledLabel?: string;
  disabledLabel?: string;
}

export const SettingsBooleanManager = ({
  title,
  description,
  settingKey,
  enabledLabel = "Enabled",
  disabledLabel = "Disabled",
}: SettingsBooleanManagerProps) => {
  const { data, isFetching, error } = useSettings(settingKey);
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateSettings();

  const currentValue = (() => {
    if (typeof data?.settingValue === 'boolean') {
      return data.settingValue;
    }
    if (typeof data?.settingValue === 'string') {
      return data.settingValue === 'true';
    }
    return false;
  })();

  const handleToggle = () => {
    const newValue = !currentValue;
    updateSettings({
      settingKey,
      settingValue: newValue,
    });
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.skeletonContainer}>
          <Skeleton style={{ height: "2.5rem", width: "100%" }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <p>Error loading setting: {error.message}</p>
        </div>
      );
    }

    return (
      <div className={styles.toggleContainer}>
        <div className={styles.statusDisplay}>
          <span className={`${styles.statusBadge} ${currentValue ? styles.enabled : styles.disabled}`}>
            {currentValue ? enabledLabel : disabledLabel}
          </span>
        </div>
        <Button
          onClick={handleToggle}
          disabled={isUpdating}
          variant={currentValue ? "secondary" : "primary"}
          size="md"
        >
          {currentValue ? "Disable" : "Enable"}
        </Button>
      </div>
    );
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};