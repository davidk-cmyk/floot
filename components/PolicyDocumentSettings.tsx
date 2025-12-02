import React, { useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useUpdateSettings } from "../helpers/useSettingsApi";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Switch } from "./Switch";
import { toast } from "sonner";
import styles from "./PolicyDocumentSettings.module.css";

const SETTING_KEYS = {
  INCLUDE_LOGO: "policyDocument.includeLogoInHeader",
  INCLUDE_DATE_CREATED: "policyDocument.includeDateCreated",
  INCLUDE_DATE_REVIEWED: "policyDocument.includeDateReviewed",
  INCLUDE_DATE_APPROVED: "policyDocument.includeDateApproved",
  INCLUDE_AUTHOR: "policyDocument.includeAuthor",
  INCLUDE_REVIEWER: "policyDocument.includeReviewer",
  INCLUDE_APPROVER: "policyDocument.includeApprover",
};

const settingsSchema = z.object({
  includeLogoInHeader: z.boolean(),
  includeDateCreated: z.boolean(),
  includeDateReviewed: z.boolean(),
  includeDateApproved: z.boolean(),
  includeAuthor: z.boolean(),
  includeReviewer: z.boolean(),
  includeApprover: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const settingKeyMap: { [K in keyof SettingsFormData]: string } = {
  includeLogoInHeader: SETTING_KEYS.INCLUDE_LOGO,
  includeDateCreated: SETTING_KEYS.INCLUDE_DATE_CREATED,
  includeDateReviewed: SETTING_KEYS.INCLUDE_DATE_REVIEWED,
  includeDateApproved: SETTING_KEYS.INCLUDE_DATE_APPROVED,
  includeAuthor: SETTING_KEYS.INCLUDE_AUTHOR,
  includeReviewer: SETTING_KEYS.INCLUDE_REVIEWER,
  includeApprover: SETTING_KEYS.INCLUDE_APPROVER,
};

export const PolicyDocumentSettings = () => {
  // Individual query hooks
  const includeLogoQuery = useSettings(SETTING_KEYS.INCLUDE_LOGO);
  const includeDateCreatedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_CREATED);
  const includeDateReviewedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_REVIEWED);
  const includeDateApprovedQuery = useSettings(SETTING_KEYS.INCLUDE_DATE_APPROVED);
  const includeAuthorQuery = useSettings(SETTING_KEYS.INCLUDE_AUTHOR);
  const includeReviewerQuery = useSettings(SETTING_KEYS.INCLUDE_REVIEWER);
  const includeApproverQuery = useSettings(SETTING_KEYS.INCLUDE_APPROVER);

  const { mutate: updateSetting, isPending: isUpdating } = useUpdateSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  // Helper function to safely extract boolean values
  const getBoolean = useCallback((value: unknown): boolean => {
    return typeof value === "boolean" ? value : true;
  }, []);

  // Check if all queries are loaded
  const allQueries = [
    includeLogoQuery,
    includeDateCreatedQuery,
    includeDateReviewedQuery,
    includeDateApprovedQuery,
    includeAuthorQuery,
    includeReviewerQuery,
    includeApproverQuery,
  ];

  const allLoaded = allQueries.every((q) => !q.isFetching);
  const hasError = allQueries.some((q) => q.error);
  const firstError = allQueries.find((q) => q.error)?.error;

  useEffect(() => {
    if (allLoaded && !hasError) {
      console.log("PolicyDocumentSettings: All queries loaded, initializing form");
      const initialValues: SettingsFormData = {
        includeLogoInHeader: getBoolean(includeLogoQuery.data?.settingValue),
        includeDateCreated: getBoolean(includeDateCreatedQuery.data?.settingValue),
        includeDateReviewed: getBoolean(includeDateReviewedQuery.data?.settingValue),
        includeDateApproved: getBoolean(includeDateApprovedQuery.data?.settingValue),
        includeAuthor: getBoolean(includeAuthorQuery.data?.settingValue),
        includeReviewer: getBoolean(includeReviewerQuery.data?.settingValue),
        includeApprover: getBoolean(includeApproverQuery.data?.settingValue),
      };
      reset(initialValues);
    }
  }, [
    allLoaded,
    hasError,
    includeLogoQuery.data?.settingValue,
    includeDateCreatedQuery.data?.settingValue,
    includeDateReviewedQuery.data?.settingValue,
    includeDateApprovedQuery.data?.settingValue,
    includeAuthorQuery.data?.settingValue,
    includeReviewerQuery.data?.settingValue,
    includeApproverQuery.data?.settingValue,
    reset,
    getBoolean,
  ]);

  const onSubmit = (data: SettingsFormData) => {
    const promises = Object.entries(data).map(([key, value]) => {
      const settingKey = settingKeyMap[key as keyof SettingsFormData];
      if (settingKey) {
        return new Promise<void>((resolve, reject) => {
          updateSetting(
            { settingKey, settingValue: value },
            { onSuccess: () => resolve(), onError: (e) => reject(e) }
          );
        });
      }
      return Promise.resolve();
    });

    toast.promise(Promise.all(promises), {
      loading: "Saving layout settings...",
      success: "Layout settings saved successfully!",
      error: "Failed to save some settings.",
    });
  };

  const isFetching = allQueries.some((q) => q.isFetching);

  const renderContent = () => {
    if (isFetching) {
      return <Skeleton style={{ height: "400px" }} />;
    }
    if (firstError) {
      return (
        <div className={styles.errorState}>
          Error loading settings: {firstError.message}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <label>Include Logo in Header</label>
            <p>Display the uploaded logo in the document header.</p>
          </div>
          <Controller
            name="includeLogoInHeader"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                id="includeLogoInHeader"
              />
            )}
          />
        </div>

        <h3 className={styles.subheading}>Metadata Fields</h3>
        <p className={styles.subdescription}>
          Choose which metadata fields to display in the document.
        </p>

        <div className={styles.metadataGrid}>
          {/* Headers */}
          <div className={styles.gridHeader}>Display</div>
          <div className={styles.gridHeader}>Field</div>

          {/* Date Created */}
          <Controller
            name="includeDateCreated"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Date Created</label>

          {/* Date Reviewed */}
          <Controller
            name="includeDateReviewed"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Date Reviewed</label>

          {/* Date Approved */}
          <Controller
            name="includeDateApproved"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Date Approved</label>

          {/* Author */}
          <Controller
            name="includeAuthor"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Author</label>

          {/* Reviewer */}
          <Controller
            name="includeReviewer"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Reviewer</label>

          {/* Approver */}
          <Controller
            name="includeApprover"
            control={control}
            render={({ field }) => (
              <Switch
                className={styles.gridSwitch}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label>Approver</label>
        </div>

        <div className={styles.formActions}>
          <Button type="submit" disabled={isUpdating || !isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Layout Settings</h2>
      <p className={styles.description}>
        Customize document layout, headers, and footers.
      </p>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};