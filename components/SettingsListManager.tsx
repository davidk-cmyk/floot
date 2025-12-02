import React, { useState, useEffect } from "react";
import {
  useSettings,
  useUpdateSettings,
} from "../helpers/useSettingsApi";
import { isStringArray } from "../helpers/jsonTypeGuards";
import { Input } from "./Input";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Badge } from "./Badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import styles from "./SettingsListManager.module.css";
import { toast } from "sonner";

interface SettingsListManagerProps {
  title: string;
  description: string;
  settingKey: string;
  noun: string;
  placeholder: string;
}

export const SettingsListManager = ({
  title,
  description,
  settingKey,
  noun,
  placeholder,
}: SettingsListManagerProps) => {
  const { data, isFetching, error } = useSettings(settingKey);
  const { mutate: updateSettings, isPending: isUpdating } =
    useUpdateSettings();

  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (!data?.settingValue) {
      setItems([]);
      return;
    }

    // If it's already an array of strings, use it directly
    if (isStringArray(data.settingValue)) {
      setItems(data.settingValue);
      return;
    }

    // If it's a JSON string, try to parse it
    if (typeof data.settingValue === 'string') {
      try {
        const parsed = JSON.parse(data.settingValue);
        if (isStringArray(parsed)) {
          setItems(parsed);
          return;
        }
      } catch (error) {
        console.error(`Failed to parse settingValue for ${settingKey}:`, error);
        toast.error('Failed to load settings: Invalid data format');
      }
    }

    // Fallback to empty array if we couldn't process the value
    console.warn(`Unexpected settingValue format for ${settingKey}:`, data.settingValue);
    setItems([]);
  }, [data, settingKey]);

  const handleAddItem = () => {
    const trimmedItem = newItem.trim();
    if (trimmedItem && !items.includes(trimmedItem)) {
      const updatedItems = [...items, trimmedItem];
      updateSettings(
        { settingKey, settingValue: updatedItems },
        {
          onSuccess: () => {
            setNewItem("");
          },
        }
      );
    } else if (items.includes(trimmedItem)) {
      toast.warning(`'${trimmedItem}' already exists.`);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    updateSettings({ settingKey, settingValue: updatedItems });
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleUpdateItem = () => {
    if (editingIndex === null) return;
    const trimmedValue = editingValue.trim();
    if (!trimmedValue) {
      toast.error("Value cannot be empty.");
      return;
    }
    if (
      items.includes(trimmedValue) &&
      items[editingIndex] !== trimmedValue
    ) {
      toast.warning(`'${trimmedValue}' already exists.`);
      return;
    }

    const updatedItems = [...items];
    updatedItems[editingIndex] = trimmedValue;
    updateSettings(
      { settingKey, settingValue: updatedItems },
      {
        onSuccess: () => {
          cancelEditing();
        },
      }
    );
  };

  const renderContent = () => {
    if (isFetching) {
      return (
        <div className={styles.skeletonContainer}>
          <Skeleton style={{ height: "2.5rem", marginBottom: "1rem" }} />
          <Skeleton style={{ height: "2rem", width: "80%" }} />
          <Skeleton style={{ height: "2rem", width: "90%" }} />
          <Skeleton style={{ height: "2rem", width: "70%" }} />
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <p>Error loading settings: {error.message}</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.addForm}>
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            disabled={isUpdating}
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          />
          <Button
            onClick={handleAddItem}
            disabled={isUpdating || !newItem.trim()}
            size="md"
          >
            <Plus size={16} />
            Add {noun}
          </Button>
        </div>

        {items.length > 0 ? (
          <ul className={styles.list}>
            {items.map((item, index) => (
              <li key={index} className={styles.listItem}>
                {editingIndex === index ? (
                  <div className={styles.editForm}>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateItem()}
                    />
                    <Button
                      size="icon-md"
                      variant="ghost"
                      onClick={handleUpdateItem}
                      disabled={isUpdating}
                      aria-label="Save"
                    >
                      <Save size={16} />
                    </Button>
                    <Button
                      size="icon-md"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isUpdating}
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Badge variant="secondary">{item}</Badge>
                    <div className={styles.actions}>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => startEditing(index, item)}
                        disabled={isUpdating}
                        aria-label={`Edit ${item}`}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className={styles.deleteButton}
                        onClick={() => handleRemoveItem(index)}
                        disabled={isUpdating}
                        aria-label={`Delete ${item}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <p>No {noun}s found. Add one to get started.</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};