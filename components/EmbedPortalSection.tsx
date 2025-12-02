import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Code, Copy } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import styles from "./EmbedPortalSection.module.css";

type EmbedPortalSectionProps = {
  customDomain?: string;
  className?: string;
};

export const EmbedPortalSection = ({
  customDomain,
  className,
}: EmbedPortalSectionProps) => {
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("600");
  const [embedBorder, setEmbedBorder] = useState("1");

  const embedCode = useMemo(() => {
    const isProduction =
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("127.0.0.1");
    let embedUrl;

    if (customDomain && customDomain.trim()) {
      embedUrl = `https://${customDomain}/public`;
    } else if (isProduction) {
      embedUrl = `${window.location.origin}/public`;
    } else {
      embedUrl = "https://your-domain.com/public";
    }

    const borderStyle =
      embedBorder === "0" ? "0" : `${embedBorder}px solid #ddd`;

    return `<iframe 
  src="${embedUrl}"
  width="${embedWidth}"
  height="${embedHeight}px"
  style="border: ${borderStyle}; border-radius: 8px;"
  title="Policy Portal">
  <p>Your browser does not support iframes. <a href="${embedUrl}">Visit our policy portal directly</a>.</p>
</iframe>`;
  }, [customDomain, embedWidth, embedHeight, embedBorder]);

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard!");
  };

  return (
    <div className={`${styles.formGroup} ${className ?? ""}`}>
      <label className={styles.label}>Embed on Your Website</label>
      <div className={styles.embedSection}>
        <p className={styles.embedDescription}>
          Generate HTML code to embed your public policy portal directly into
          your corporate website. This allows visitors to browse policies
          without leaving your site.
        </p>

        <div className={styles.embedCustomization}>
          <h4 className={styles.embedSubtitle}>Customize Embed</h4>
          <div className={styles.embedOptions}>
            <div className={styles.embedOption}>
              <label htmlFor="embedWidth" className={styles.embedOptionLabel}>
                Width
              </label>
              <Input
                id="embedWidth"
                value={embedWidth}
                onChange={(e) => setEmbedWidth(e.target.value)}
                placeholder="100% or 800px"
              />
            </div>
            <div className={styles.embedOption}>
              <label htmlFor="embedHeight" className={styles.embedOptionLabel}>
                Height (px)
              </label>
              <Input
                id="embedHeight"
                type="number"
                value={embedHeight}
                onChange={(e) => setEmbedHeight(e.target.value)}
                placeholder="600"
                min="300"
              />
            </div>
            <div className={styles.embedOption}>
              <label htmlFor="embedBorder" className={styles.embedOptionLabel}>
                Border (px)
              </label>
              <Input
                id="embedBorder"
                type="number"
                value={embedBorder}
                onChange={(e) => setEmbedBorder(e.target.value)}
                placeholder="1"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className={styles.embedCodeSection}>
          <div className={styles.embedCodeHeader}>
            <div className={styles.embedCodeInfo}>
              <div className={styles.embedCodeIconWrapper}>
                <Code className={styles.embedCodeIcon} />
              </div>
              <div>
                <h4 className={styles.embedCodeTitle}>HTML Embed Code</h4>
                <p className={styles.embedCodeSubtitle}>
                  Copy this code and paste it into your website
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCopyEmbedCode}
            >
              <Copy size={16} />
              Copy Code
            </Button>
          </div>
          <textarea
            className={styles.embedCodeTextarea}
            value={embedCode}
            readOnly
            rows={8}
          />
        </div>

        <div className={styles.embedInstructions}>
          <h4 className={styles.embedSubtitle}>Implementation Instructions</h4>
          <ul className={styles.embedInstructionsList}>
            <li>Copy the HTML code above</li>
            <li>
              Paste it into your website's HTML where you want the portal to
              appear
            </li>
            <li>The portal will be fully responsive within the iframe dimensions</li>
            <li>
              Visitors can search and view all public policies directly from
              your site
            </li>
            {window.location.hostname === "localhost" && (
              <li className={styles.developmentNote}>
                <strong>Development Note:</strong> In production, this will use
                your actual domain. Configure a custom domain above for branded
                embedding.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};