import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { X, Tag } from "lucide-react";
import { usePolicyTaxonomies } from "../helpers/globalPolicyTaxonomies";
import { useUpdateCustomTaxonomies } from "../helpers/useSettingsApi";
import { Badge } from "./Badge";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";
import styles from "./PolicyTagsInput.module.css";

type TaxonomyType = "tags" | "categories" | "departments";

type PolicyTagsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  taxonomyType: TaxonomyType;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const PolicyTagsInput = ({
  value = [],
  onChange,
  onBlur,
  taxonomyType,
  placeholder = "Add tags...",
  disabled,
  className,
}: PolicyTagsInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    combinedCategories,
    combinedDepartments,
    combinedTags,
    isLoading: isLoadingTaxonomies,
  } = usePolicyTaxonomies();

  const {
    addCustomCategory,
    addCustomDepartment,
    addCustomTag,
    isLoading: isUpdatingTaxonomies,
  } = useUpdateCustomTaxonomies();

  const isLoading = isLoadingTaxonomies || isUpdatingTaxonomies;

  const allAvailableTags = {
    tags: combinedTags,
    categories: combinedCategories,
    departments: combinedDepartments,
  }[taxonomyType];

  const filteredSuggestions = allAvailableTags
    .filter(
      (tag: string) =>
        !value.find((v: string) => v.toLowerCase() === tag.toLowerCase()) &&
        tag.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, 5);

  const addTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    if (
      trimmedTag &&
      !value.find((v) => v.toLowerCase() === trimmedTag.toLowerCase())
    ) {
      const newTags = [...value, trimmedTag];
      onChange(newTags);

      // Persist new tag to settings if it doesn't exist
      if (
        !allAvailableTags.find(
          (t: string) => t.toLowerCase() === trimmedTag.toLowerCase()
        )
      ) {
        switch (taxonomyType) {
          case "tags":
            addCustomTag(trimmedTag);
            break;
          case "categories":
            addCustomCategory(trimmedTag);
            break;
          case "departments":
            addCustomDepartment(trimmedTag);
            break;
        }
      }
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    const newTags = value.filter(
      (tag) => tag.toLowerCase() !== tagToRemove.toLowerCase()
    );
    onChange(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue) {
      addTag(inputValue);
    }
    onBlur?.();
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  if (isLoadingTaxonomies) {
    return <Skeleton style={{ height: "2.5rem" }} className={className} />;
  }

  return (
    <div
      className={`${styles.container} ${isFocused ? styles.focused : ""} ${
        disabled ? styles.disabled : ""
      } ${className || ""}`}
      onClick={handleContainerClick}
      aria-disabled={disabled}
    >
      <Tag className={styles.tagIcon} size={16} />
      <div className={styles.tagsWrapper}>
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className={styles.tagBadge}>
            <span>{tag}</span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove ${tag}`}
              disabled={disabled}
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
        <div className={styles.inputContainer}>
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled || isLoading}
            className={styles.input}
            aria-label="Add a new tag"
          />
          {isFocused && inputValue && filteredSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              <ul>
                {filteredSuggestions.map((suggestion: string) => (
                  <li
                    key={suggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(suggestion);
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};