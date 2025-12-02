import { LucideIcon, Briefcase, ShieldAlert, HeartHandshake, BookText } from 'lucide-react';

/**
 * Defines the categories for policy templates.
 * This is a union of string literals for type safety.
 */
export type PolicyTemplateCategory =
  | 'Employment & HR'
  | 'Data Protection & Privacy'
  | 'Health & Safety'
  | 'Business Operations';

/**
 * Defines the type of a policy template, indicating its importance.
 * 'required': Essential for legal compliance or core operations.
 * 'recommended': Best practice, but not strictly mandatory.
 */
export type PolicyTemplateType = 'required' | 'recommended';

/**
 * Interface representing a single pre-written policy template.
 */
export interface PolicyTemplate {
  id: string;
  title: string;
  description: string;
  category: PolicyTemplateCategory;
  type: PolicyTemplateType;
  estimatedTime: number; // Estimated time to read and implement, in minutes.
  content: string; // The full content of the policy template in Markdown format.
}

/**
 * Metadata for each policy template category, including a display name,
 * an associated icon from lucide-react, and a brief description.
 * This is used to build UI elements for browsing templates by category.
 */
export const POLICY_TEMPLATE_CATEGORIES: {
  name: PolicyTemplateCategory;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    name: 'Employment & HR',
    icon: Briefcase,
    description: 'Essential policies for managing your team and staying compliant.',
  },
  {
    name: 'Data Protection & Privacy',
    icon: ShieldAlert,
    description: 'Protect sensitive data and comply with UK GDPR regulations.',
  },
  {
    name: 'Health & Safety',
    icon: HeartHandshake,
    description: 'Ensure a safe working environment for your employees and visitors.',
  },
  {
    name: 'Business Operations',
    icon: BookText,
    description: 'Policies to streamline your daily operations and manage risk.',
  },
];