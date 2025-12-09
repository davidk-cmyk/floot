import React, { useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  UploadCloud,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { FileDropzone } from "./FileDropzone";
import styles from "./BrandingFormSection.module.css";

const brandingSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required."),
  logo: z.string().optional(),
  portalName: z.string().optional(),
  portalDescription: z.string().optional(),
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
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(
          val
        ),
      "Invalid domain name"
    ),
});

export type BrandingFormData = z.infer<typeof brandingSchema>;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const DnsRecord = ({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.dnsRecord}>
      <span className={styles.dnsType}>{type}</span>
      <div className={styles.dnsDetails}>
        <p>
          <strong>Name:</strong> {name}
        </p>
        <p>
          <strong>Value:</strong> <code>{value}</code>
        </p>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={handleCopy}
        aria-label="Copy value"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </div>
  );
};

type BrandingFormSectionProps = {
  control: Control<BrandingFormData>;
  register: UseFormRegister<BrandingFormData>;
  errors: FieldErrors<BrandingFormData>;
  setValue: UseFormSetValue<BrandingFormData>;
  logoValue?: string;
  className?: string;
};

export const BrandingFormSection = ({
  control,
  register,
  errors,
  setValue,
  logoValue,
  className,
}: BrandingFormSectionProps) => {
  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error("Logo image must be smaller than 2MB.");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setValue("logo", base64, { shouldDirty: true });
      } catch (error) {
        toast.error("Failed to read the logo file.");
        console.error("Error converting file to base64:", error);
      }
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-6)', color: 'var(--surface-foreground)' }}>Organization & Visual Identity</h3>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="organizationName" className={styles.label}>
            Organization Name
          </label>
          <Input
            id="organizationName"
            {...register("organizationName")}

          />
          {errors.organizationName && (
            <span className={styles.errorText}>{errors.organizationName.message}</span>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="logo" className={styles.label}>
            Logo
          </label>
          <div className={styles.logoUploadContainer}>
            <div className={styles.logoPreview}>
              {logoValue ? (
                <img src={logoValue} alt="Logo Preview" />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <ImageIcon size={32} />
                </div>
              )}
            </div>
            <FileDropzone
              className={styles.fileDropzone}
              onFilesSelected={handleFileSelect}
              accept="image/png, image/jpeg, image/svg+xml"
              maxSize={2 * 1024 * 1024} // 2MB
              icon={<UploadCloud size={32} />}
              title="Click or drag to upload"
              subtitle="PNG, JPG, SVG (max 2MB)"
            />
          </div>
          {errors.logo && (
            <span className={styles.errorText}>{errors.logo.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="portalName" className={styles.label}>
            Default Portal Name
          </label>
          <Input
            id="portalName"
            {...register("portalName")}
            placeholder="e.g., Employee Policy Center"
          />
          <p className={styles.helperText}>
            Used as the default name for portals when not customized
          </p>
          {errors.portalName && (
            <span className={styles.errorText}>{errors.portalName.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="portalDescription" className={styles.label}>
            Default Portal Description
          </label>
          <Textarea
            id="portalDescription"
            {...register("portalDescription")}
            placeholder="Welcome message shown to portal visitors"
            rows={3}
          />
          <p className={styles.helperText}>
            This description will appear at the top of portal pages
          </p>
          {errors.portalDescription && (
            <span className={styles.errorText}>{errors.portalDescription.message}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="primaryColor" className={styles.label}>
            Primary Color
          </label>
          <Controller
            name="primaryColor"
            control={control}
            render={({ field }) => (
              <div className={styles.colorPickerContainer}>
                <input
                  type="color"
                  id="primaryColor"
                  className={styles.colorInput}
                  {...field}
                />
                <span
                  className={styles.colorPreview}
                  style={{ backgroundColor: field.value }}
                />
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={styles.hexInput}
                />
              </div>
            )}
          />
          {errors.primaryColor && (
            <span className={styles.errorText}>{errors.primaryColor.message}</span>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="secondaryColor" className={styles.label}>
            Secondary Color
          </label>
          <Controller
            name="secondaryColor"
            control={control}
            render={({ field }) => (
              <div className={styles.colorPickerContainer}>
                <input
                  type="color"
                  id="secondaryColor"
                  className={styles.colorInput}
                  {...field}
                />
                <span
                  className={styles.colorPreview}
                  style={{ backgroundColor: field.value }}
                />
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={styles.hexInput}
                />
              </div>
            )}
          />
          {errors.secondaryColor && (
            <span className={styles.errorText}>
              {errors.secondaryColor.message}
            </span>
          )}
        </div>
        <div className={styles.formGroup} style={{ opacity: 0.5 }}>
          <label htmlFor="customDomain" className={styles.label}>
            Custom Domain
            <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'var(--muted)', borderRadius: '4px', color: 'var(--muted-foreground)', fontWeight: 'normal' }}>Coming Soon</span>
          </label>
          <Input
            id="customDomain"
            placeholder="e.g., policies.yourcompany.com"
            disabled={true}
            style={{ cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
            Custom domain support is coming soon. You'll be able to use your own domain for your policy portal.
          </p>
        </div>
      </div>
    </div>
  );
};