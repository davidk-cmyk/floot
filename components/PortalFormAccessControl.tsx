import React from 'react';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Checkbox } from './Checkbox';
import { Shield } from 'lucide-react';
import { UserRoleArrayValues, UserRole } from '../helpers/schema';
import { accessTypeOptions } from '../helpers/portalFormConstants';
import { PortalFormData } from '../helpers/portalFormValidation';
import styles from './PortalFormAccessControl.module.css';

type PortalFormAccessControlProps = {
  values: PortalFormData;
  setValues: (updater: (prev: PortalFormData) => PortalFormData) => void;
  isEditing: boolean;
};

export const PortalFormAccessControl: React.FC<PortalFormAccessControlProps> = ({
  values,
  setValues,
  isEditing,
}) => {
  const accessType = values.accessType;
  const selectedAccessType = accessTypeOptions.find(option => option.value === accessType);

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setValues((prev: PortalFormData) => {
      const newRoles = checked
        ? [...(prev.allowedRoles || []), role]
        : (prev.allowedRoles || []).filter((r: UserRole) => r !== role);
      return { ...prev, allowedRoles: newRoles };
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Shield className={styles.sectionIcon} />
        <div>
          <h3 className={styles.sectionTitle}>Access Control</h3>
          <p className={styles.sectionDescription}>
            Configure who can access this portal and view its policies.
          </p>
        </div>
      </div>

      <div className={styles.sectionContent}>
        <FormItem name="accessType">
          <FormLabel>Access Type</FormLabel>
          <Select
            value={accessType}
            onValueChange={value => setValues((prev: PortalFormData) => ({ 
              ...prev, 
              accessType: value as PortalFormData['accessType'],
              // Clear related fields when access type changes
              password: value !== 'password' ? '' : prev.password,
              allowedRoles: value !== 'role_based' ? [] : prev.allowedRoles,
            }))}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accessTypeOptions.map(option => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className={styles.selectOption}>
                      <IconComponent className={styles.selectOptionIcon} />
                      <div>
                        <div className={styles.selectOptionLabel}>{option.label}</div>
                        <div className={styles.selectOptionDescription}>{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedAccessType && (
            <FormDescription>
              <strong>{selectedAccessType.label}:</strong> {selectedAccessType.description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>

        {accessType === 'password' && (
          <FormItem name="password">
            <FormLabel>Portal Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                placeholder={isEditing ? 'Enter new password to change (leave blank to keep current)' : 'Enter a secure password'}
                value={values.password ?? ''}
                onChange={e => setValues((prev: PortalFormData) => ({ ...prev, password: e.target.value }))}
              />
            </FormControl>
            <FormDescription>
              Must be at least 8 characters long. Users will need this password to access the portal.
              {isEditing && ' Leave blank to keep the current password unchanged.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}

        {accessType === 'role_based' && (
          <FormItem name="allowedRoles">
            <FormLabel>Allowed User Roles</FormLabel>
            <div className={styles.roleCheckboxes}>
              {UserRoleArrayValues.map(role => (
                <div key={role} className={styles.checkboxItem}>
                  <FormControl>
                    <Checkbox
                      id={`role-${role}`}
                      checked={(values.allowedRoles || []).includes(role)}
                      onChange={e => handleRoleChange(role, e.target.checked)}
                    />
                  </FormControl>
                  <label htmlFor={`role-${role}`} className={styles.checkboxLabel}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                </div>
              ))}
            </div>
            <FormDescription>
              Select which user roles are allowed to access this portal. Only users with these roles will be able to view the policies.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      </div>
    </div>
  );
};