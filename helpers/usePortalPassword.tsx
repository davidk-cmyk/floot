import { useState, useEffect } from "react";

const STORAGE_KEY_PREFIX = "portal_password_";

/**
 * Custom hook to manage password state for password-protected portals.
 * Uses sessionStorage to persist the password across page navigations within the same session.
 * 
 * @param portalSlug - The unique slug identifier for the portal
 * @returns Object containing password state and update function
 */
export const usePortalPassword = (portalSlug: string) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${portalSlug}`;
  
  // Initialize password from sessionStorage if available
  const [password, setPasswordState] = useState<string | undefined>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored || undefined;
    } catch (error) {
      console.error('[usePortalPassword] Failed to read from sessionStorage:', error);
      return undefined;
    }
  });

  // Update password in both state and sessionStorage
  const setPassword = (newPassword: string | undefined) => {
    setPasswordState(newPassword);
    
    try {
      if (newPassword) {
        sessionStorage.setItem(storageKey, newPassword);
        console.log('[usePortalPassword] Password stored in sessionStorage for portal:', portalSlug);
      } else {
        sessionStorage.removeItem(storageKey);
        console.log('[usePortalPassword] Password removed from sessionStorage for portal:', portalSlug);
      }
    } catch (error) {
      console.error('[usePortalPassword] Failed to write to sessionStorage:', error);
    }
  };

  // Clear password when component unmounts (optional cleanup)
  useEffect(() => {
    return () => {
      // We don't clear on unmount because we want persistence across navigations
      // Password will be cleared automatically when the browser tab/window closes
    };
  }, []);

  return {
    password,
    setPassword,
  };
};