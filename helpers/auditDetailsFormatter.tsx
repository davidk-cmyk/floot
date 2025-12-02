import React from "react";
import styles from "./auditDetailsFormatter.module.css";

type AuditChange = {
  oldValue: unknown;
  newValue: unknown;
};

type AuditDetails = Record<string, AuditChange>;

const isAuditDetails = (value: unknown): value is AuditDetails => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Object.values(value).every(
    (change) =>
      typeof change === "object" &&
      change !== null &&
      "oldValue" in change &&
      "newValue" in change
  );
};

const camelToTitleCase = (str: string) => {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "not set";
  }
  if (typeof value === "boolean") {
    return value ? "enabled" : "disabled";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `[${value.join(", ")}]` : "empty";
  }
  if (typeof value === "string" && Date.parse(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }
  return `'${String(value)}'`;
};

const formatSingleChange = (
  field: string,
  change: AuditChange
): string | null => {
  const { oldValue, newValue } = change;

  switch (field) {
    case "content":
      return "Content was updated.";
    case "title":
      return `Title changed from ${formatValue(oldValue)} to ${formatValue(
        newValue
      )}.`;
    case "status":
      return `Status changed from ${formatValue(oldValue)} to ${formatValue(
        newValue
      )}.`;
    case "effectiveDate":
      return `Effective date was updated to ${formatValue(newValue)}.`;
    case "expirationDate":
      return `Expiration date was updated to ${formatValue(newValue)}.`;
    case "category":
      return `Category changed from ${formatValue(oldValue)} to ${formatValue(
        newValue
      )}.`;
    case "department":
      return `Department changed from ${formatValue(oldValue)} to ${formatValue(
        newValue
      )}.`;
    case "tags":
      return "Tags were updated.";

    case "requiresAcknowledgment":
      return newValue === true
        ? "Acknowledgment is now required."
        : "Acknowledgment is no longer required.";
    default:
      // Fallback for unknown fields
      return `${camelToTitleCase(field)} changed from ${formatValue(
        oldValue
      )} to ${formatValue(newValue)}.`;
  }
};

/**
 * Takes raw audit details JSON and converts it into a human-readable summary.
 * @param details The JSON object from the policy_audit_log.details column.
 * @returns A ReactNode with a formatted summary of changes, or a fallback message.
 */
export const formatAuditDetails = (
  details: unknown
): React.ReactNode => {
  if (!isAuditDetails(details)) {
    return <p className={styles.noDetails}>No specific details available.</p>;
  }

  const changes = Object.entries(details)
    .map(([field, change]) => formatSingleChange(field, change))
    .filter((change): change is string => change !== null);

  if (changes.length === 0) {
    return <p className={styles.noDetails}>No changes recorded.</p>;
  }

  if (changes.length === 1) {
    return <p>{changes[0]}</p>;
  }

  return (
    <ul className={styles.changeList}>
      {changes.map((change, index) => (
        <li key={index}>{change}</li>
      ))}
    </ul>
  );
};