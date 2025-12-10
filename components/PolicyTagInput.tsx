import React, { useState, useMemo, useEffect } from "react";
import { AutoComplete, Option } from "./AutoComplete";
import { usePolicyTaxonomies } from "../helpers/globalPolicyTaxonomies";
import { useUpdateCustomTaxonomies } from "../helpers/useSettingsApi";
import styles from "./PolicyTagInput.module.css";

type PolicyTagInputProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  settingKey: "departments" | "categories";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const PolicyTagInput = ({
  value,
  onChange,
  onBlur,
  settingKey,
  placeholder,
  disabled,
  className,
}: PolicyTagInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");

  const { combinedCategories, combinedDepartments, isLoading } = usePolicyTaxonomies();
  const {
    addCustomCategory,
    addCustomDepartment,
    isLoading: isUpdating,
  } = useUpdateCustomTaxonomies();

  const existingTags = useMemo(() => {
    return settingKey === "categories" ? combinedCategories : combinedDepartments;
  }, [settingKey, combinedCategories, combinedDepartments]);

  const options: Option[] = useMemo(
    () => existingTags.map((tag) => ({ value: tag, label: tag })),
    [existingTags],
  );

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleValueChange = (option: Option) => {
    const newValue = option.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    onBlur?.();

    const trimmedValue = inputValue.trim();
    if (
      trimmedValue &&
      !existingTags.find(
        (tag) => tag.toLowerCase() === trimmedValue.toLowerCase(),
      )
    ) {
      // Persist new custom item
      if (settingKey === "categories") {
        addCustomCategory(trimmedValue);
      } else {
        addCustomDepartment(trimmedValue);
      }
    }
    // Ensure form state is updated on blur, even if it's an existing tag
    if (value !== trimmedValue) {
      onChange(trimmedValue);
    }
  };

  return (
    <div onBlur={handleBlur} className={className}>
      <AutoComplete
        options={options}
        value={value ? { value, label: value } : undefined}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        placeholder={placeholder}
        emptyMessage="No matching tags found."
        isLoading={isLoading || isUpdating}
        disabled={disabled}
        allowFreeForm
      />
    </div>
  );
};