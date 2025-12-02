import React, { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { AutoComplete, Option } from "./AutoComplete";
import { useSettings, useUpdateSettings } from "../helpers/useSettingsApi";
import styles from "./PolicyTagInput.module.css";

const tagsSchema = z.array(z.string());

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

  const { data: settings, isFetching } = useSettings(settingKey);
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateSettings();

  const existingTags = useMemo(() => {
    if (settings?.settingValue) {
      const parsed = tagsSchema.safeParse(settings.settingValue);
      if (parsed.success) {
        return parsed.data;
      }
      console.error(
        `Failed to parse settings for ${settingKey}:`,
        parsed.error,
      );
    }
    return [];
  }, [settings, settingKey]);

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
      const newTags = [...existingTags, trimmedValue];
      updateSettings({
        settingKey,
        settingValue: newTags,
      });
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
        isLoading={isFetching || isUpdating}
        disabled={disabled}
        allowFreeForm
      />
    </div>
  );
};