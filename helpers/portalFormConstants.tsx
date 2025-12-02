import { Globe, Lock } from 'lucide-react';

export const accessTypeOptions = [
  {
    value: 'public' as const,
    label: 'Public Access',
    description: 'Anyone can view policies without authentication',
    icon: Globe,
  },
  {
    value: 'password' as const,
    label: 'Password Protected',
    description: 'Requires a shared password to access the portal',
    icon: Lock,
  },
];