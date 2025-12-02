import React, { useState } from "react";
import { Lock } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import styles from "./PasswordPrompt.module.css";

interface PasswordPromptProps {
  portalName: string;
  onSubmit: (password: string) => void;
  error?: string;
  className?: string;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({
  portalName,
  onSubmit,
  error,
  className,
}) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.card}>
        <Lock size={32} className={styles.icon} />
        <h1 className={styles.title}>Password Required</h1>
        <p className={styles.subtitle}>
          Please enter the password to access the "{portalName}" portal.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={styles.input}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" disabled={!password} className={styles.button}>
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};