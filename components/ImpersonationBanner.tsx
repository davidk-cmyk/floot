import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { Eye, X, Building2, User as UserIcon } from "lucide-react";
import styles from "./ImpersonationBanner.module.css";

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const { authState, onLogin } = useAuth();
  const [isEnding, setIsEnding] = useState(false);

  // Only show if authenticated and impersonating
  if (authState.type !== "authenticated" || !authState.user.impersonating) {
    return null;
  }

  const { impersonating } = authState.user;

  const handleStopImpersonation = async () => {
    setIsEnding(true);
    try {
      const res = await fetch("/_api/superadmin/stop-impersonate", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to stop impersonation");
      }

      const data = await res.json();

      // Update auth state and navigate back to super admin panel
      onLogin(data.user, false);
      navigate("/superadmin/organizations");
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
      alert("Failed to stop impersonation. Please try again.");
    } finally {
      setIsEnding(false);
    }
  };

  // Calculate time remaining if needed
  const startedAt = new Date(impersonating.startedAt);
  const elapsedMinutes = Math.floor((Date.now() - startedAt.getTime()) / 60000);
  const hoursRemaining = Math.max(0, 8 - Math.floor(elapsedMinutes / 60));
  const minutesRemaining = 60 - (elapsedMinutes % 60);

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.info}>
          <Eye size={18} className={styles.icon} />
          <span className={styles.text}>
            Viewing as
            <UserIcon size={14} className={styles.userIcon} />
            <strong>{impersonating.userDisplayName}</strong>
            <span className={styles.userRole}>({impersonating.userRole})</span>
            <span className={styles.separator}>|</span>
            <Building2 size={14} className={styles.orgIcon} />
            <span>{impersonating.organizationName}</span>
          </span>
          <span className={styles.time}>
            ({hoursRemaining}h {minutesRemaining}m remaining)
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          className={styles.stopButton}
          disabled={isEnding}
        >
          <X size={16} />
          <span>{isEnding ? "Ending..." : "Stop Viewing"}</span>
        </button>
      </div>
    </div>
  );
};
