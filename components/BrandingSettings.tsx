import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useSettingsMany, useUpdateSettings } from "../helpers/useSettingsApi";
import { useOrganization } from "../helpers/useOrganization";
import { postUpdateOrganization } from "../endpoints/organizations/update_POST.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { BrandingFormSection, BrandingFormData } from "./BrandingFormSection";
import { toast } from "sonner";
import styles from "./BrandingSettings.module.css";

const BRANDING_KEYS = {
  LOGO: "branding.logo",
  PORTAL_NAME: "branding.portalName",
  PORTAL_DESCRIPTION: "branding.portalDescription",
  PRIMARY_COLOR: "branding.primaryColor",
  SECONDARY_COLOR: "branding.secondaryColor",
  CUSTOM_DOMAIN: "branding.customDomain",
};

const brandingSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required."),
  logo: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  customDomain: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === "" ||
        val === undefined ||
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(val),
      "Invalid domain name"
    ),
});

export const BrandingSettings = () => {
  const { organizationState } = useOrganization();
  const queryClient = useQueryClient();
  
  const settingsQuery = useSettingsMany([
    BRANDING_KEYS.LOGO,
    BRANDING_KEYS.PORTAL_NAME,
    BRANDING_KEYS.PORTAL_DESCRIPTION,
    BRANDING_KEYS.PRIMARY_COLOR,
    BRANDING_KEYS.SECONDARY_COLOR,
    BRANDING_KEYS.CUSTOM_DOMAIN,
  ]);

  const { mutateAsync: updateSetting, isPending: isUpdating } = useUpdateSettings();
  
  const { mutateAsync: updateOrganization, isPending: isUpdatingOrg } = useMutation({
    mutationFn: postUpdateOrganization,
    onSuccess: () => {
      toast.success("Organization name updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update organization name: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
  });

  const logoValue = watch("logo");

  useEffect(() => {
    if (!settingsQuery.isFetching && settingsQuery.data) {
      reset({
        organizationName:
          organizationState.type === 'active' 
            ? organizationState.currentOrganization.name 
            : "",
        logo:
          settingsQuery.data[BRANDING_KEYS.LOGO]?.settingValue as string | undefined,
        portalName:
          settingsQuery.data[BRANDING_KEYS.PORTAL_NAME]?.settingValue as string | undefined,
        portalDescription:
          settingsQuery.data[BRANDING_KEYS.PORTAL_DESCRIPTION]?.settingValue as string | undefined,
        primaryColor:
          (settingsQuery.data[BRANDING_KEYS.PRIMARY_COLOR]?.settingValue as string) || "#1E40AF",
        secondaryColor:
          (settingsQuery.data[BRANDING_KEYS.SECONDARY_COLOR]?.settingValue as string) || "#475569",
        customDomain:
          (settingsQuery.data[BRANDING_KEYS.CUSTOM_DOMAIN]?.settingValue as string) || "",
      });
    }
  }, [
    settingsQuery.data,
    settingsQuery.isFetching,
    organizationState,
    reset,
  ]);

  const onSubmit = async (data: BrandingFormData) => {
    const promises: Promise<any>[] = [];
    
    // Handle organization name update separately
    if (data.organizationName && organizationState.type === 'active') {
      const currentOrgName = organizationState.currentOrganization.name;
      if (data.organizationName !== currentOrgName) {
        promises.push(
          updateOrganization({ 
            organizationId: organizationState.currentOrganization.id,
            name: data.organizationName 
          })
        );
      }
    }
    
    // Handle settings updates
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'organizationName') return; // Skip organization name as it's handled above
      
      const settingKeyMap: { [key: string]: string } = {
        logo: BRANDING_KEYS.LOGO,
        portalName: BRANDING_KEYS.PORTAL_NAME,
        portalDescription: BRANDING_KEYS.PORTAL_DESCRIPTION,
        primaryColor: BRANDING_KEYS.PRIMARY_COLOR,
        secondaryColor: BRANDING_KEYS.SECONDARY_COLOR,
        customDomain: BRANDING_KEYS.CUSTOM_DOMAIN,
      };
      const settingKey = settingKeyMap[key];
      if (settingKey) {
        promises.push(
          updateSetting({ settingKey, settingValue: value })
        );
      }
    });

    toast.promise(Promise.all(promises), {
      loading: "Saving branding settings...",
      success: () => {
        reset(data); // Reset form with new data to clear isDirty state
        return "Branding settings saved successfully!";
      },
      error: "Failed to save some settings.",
    });
  };

  const isFetching = settingsQuery.isFetching;
  const fetchError = settingsQuery.error;

  const renderContent = () => {
    if (isFetching) {
      return <Skeleton style={{ height: "400px" }} />;
    }
    if (fetchError) {
      return (
        <div className={styles.errorState}>
          Error loading branding settings: {fetchError.message}
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <BrandingFormSection
          control={control}
          register={register}
          errors={errors}
          setValue={setValue}
          logoValue={logoValue}
        />

        <div className={styles.formActions}>
          <Button type="submit" disabled={isUpdating || isUpdatingOrg || !isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Branding & Appearance</h2>
      <p className={styles.description}>
        Customize the branding and visual identity of your organization.
      </p>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};