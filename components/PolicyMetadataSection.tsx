import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Badge } from './Badge';
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { PolicyTaxonomyGroup } from './PolicyTaxonomyGroup';
import { Textarea } from './Textarea';
import { PortalSelector } from './PortalSelector';
import { DateDropdownSelector } from './DateDropdownSelector';
import styles from './PolicyMetadataSection.module.css';

interface PolicyMetadataSectionProps {
  status: string;
  onStatusChange: (value: string) => void;
  effectiveDate?: Date | null;
  onEffectiveDateChange: (date: Date | null) => void;
  expirationDate?: Date | null;
  onExpirationDateChange: (date: Date | null) => void;
  reviewDate?: Date | null;
  onReviewDateChange: (date: Date | null) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  acknowledgmentMode?: string;
  onAcknowledgmentModeChange: (value: string) => void;
  versionNotes: string;
  onVersionNotesChange: (value: string) => void;
  portalIds: number[];
  onPortalIdsChange: (portalIds: number[]) => void;
  assignedPortals?: Array<{
    id: number;
    name: string;
    slug: string;
    requiresAcknowledgment: boolean;
    acknowledgmentDueDays?: number | null;
  }>;
}

type DateDurationOption = 'specific' | '1year' | '2years' | '3years' | '4years' | '5years';

export const PolicyMetadataSection: React.FC<PolicyMetadataSectionProps> = ({
  status,
  onStatusChange,
  effectiveDate,
  onEffectiveDateChange,
  expirationDate,
  onExpirationDateChange,
  reviewDate,
  onReviewDateChange,
  department,
  onDepartmentChange,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  acknowledgmentMode,
  onAcknowledgmentModeChange,
  versionNotes,
  onVersionNotesChange,
  portalIds,
  onPortalIdsChange,
  assignedPortals,
}) => {
  // Helper function to safely convert and validate dates
  const safeDate = useCallback((value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, []);

  // Helper function to safely format dates for display
  const formatDateDisplay = (value: any): string => {
    const date = safeDate(value);
    return date ? date.toLocaleDateString() : 'Pick a date';
  };

  // Memoize safe date conversions to avoid creating new object references every render
  const safeEffectiveDate = useMemo(() => safeDate(effectiveDate), [effectiveDate, safeDate]);
  const safeExpirationDate = useMemo(() => safeDate(expirationDate), [expirationDate, safeDate]);
  const safeReviewDate = useMemo(() => safeDate(reviewDate), [reviewDate, safeDate]);

  const [expirationDateOption, setExpirationDateOption] = useState<DateDurationOption>('specific');
  const [reviewDateOption, setReviewDateOption] = useState<DateDurationOption>('specific');

  const showReviewDateWarning = !safeReviewDate;

  const calculateDateFromEffective = useCallback((option: DateDurationOption, baseDate?: Date | null): Date | null => {
    if (option === 'specific' || !baseDate) {
      return null;
    }
    
    const years = {
      '1year': 1,
      '2years': 2,
      '3years': 3,
      '4years': 4,
      '5years': 5,
    }[option];
    
    if (!years) return null;
    
    const calculatedDate = new Date(baseDate);
    calculatedDate.setFullYear(calculatedDate.getFullYear() + years);
    return calculatedDate;
  }, []);

  useEffect(() => {
    if (expirationDateOption !== 'specific' && safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(expirationDateOption, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeExpirationDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          onExpirationDateChange(calculatedDate);
        }
      }
    }
  }, [safeEffectiveDate, expirationDateOption, calculateDateFromEffective, onExpirationDateChange, safeExpirationDate]);

  useEffect(() => {
    if (reviewDateOption !== 'specific' && safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(reviewDateOption, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeReviewDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          onReviewDateChange(calculatedDate);
        }
      }
    }
  }, [safeEffectiveDate, reviewDateOption, calculateDateFromEffective, onReviewDateChange, safeReviewDate]);

  const handleExpirationDateOptionChange = (option: DateDurationOption) => {
    setExpirationDateOption(option);
    if (option === 'specific') return;
    if (safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(option, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeExpirationDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          onExpirationDateChange(calculatedDate);
        }
      }
    }
  };

  const handleReviewDateOptionChange = (option: DateDurationOption) => {
    setReviewDateOption(option);
    if (option === 'specific') return;
    if (safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(option, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeReviewDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          onReviewDateChange(calculatedDate);
        }
      }
    }
  };

  const getDateOptionLabel = (option: DateDurationOption): string => {
    switch (option) {
      case 'specific': return 'Custom Date';
      case '1year': return '1 Year from Effective';
      case '2years': return '2 Years from Effective';
      case '3years': return '3 Years from Effective';
      case '4years': return '4 Years from Effective';
      case '5years': return '5 Years from Effective';
      default: return 'Custom Date';
    }
  };

  // Check if review date is valid (not earlier than effective date or expiration date)
  const isReviewDateValid = useMemo(() => {
    if (!safeReviewDate) return true;
    
    let isValid = true;
    
    // Check against effective date
    if (safeEffectiveDate && safeReviewDate < safeEffectiveDate) {
      isValid = false;
    }
    
    // Check against expiration date
    if (safeExpirationDate && safeReviewDate < safeExpirationDate) {
      isValid = false;
    }
    
    return isValid;
  }, [safeReviewDate, safeEffectiveDate, safeExpirationDate]);

  return (
    <div className={styles.container}>
      {/* Status Selector - Prominent at the top */}
      <FormItem name="status">
        <FormLabel>Status</FormLabel>
        <FormControl>
          <Select value={status || 'draft'} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>

      <div className={styles.dateSection}>
        <FormItem name="effectiveDate">
          <FormLabel>Effective Date</FormLabel>
          <FormControl>
            <DateDropdownSelector
              value={safeEffectiveDate}
              onChange={onEffectiveDateChange}
            />
          </FormControl>
          <FormDescription>
            Select the date when this policy becomes effective
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="expirationDate">
          <FormLabel>Expiration Date</FormLabel>
          <div className={styles.durationDateContainer}>
            <Select value={expirationDateOption} onValueChange={handleExpirationDateOptionChange}>
              <SelectTrigger className={styles.durationSelect}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1year">1 Year from Effective</SelectItem>
                <SelectItem value="2years">2 Years from Effective</SelectItem>
                <SelectItem value="3years">3 Years from Effective</SelectItem>
                <SelectItem value="4years">4 Years from Effective</SelectItem>
                <SelectItem value="5years">5 Years from Effective</SelectItem>
                <SelectItem value="specific">Custom Date</SelectItem>
              </SelectContent>
            </Select>
            
            {expirationDateOption === 'specific' && (
              <FormControl>
                <DateDropdownSelector
                  value={safeExpirationDate}
                  onChange={onExpirationDateChange}
                />
              </FormControl>
            )}
            
            {expirationDateOption !== 'specific' && safeExpirationDate && (
              <div className={styles.calculatedDate}>
                <CalendarIcon size={16} />
                <span>{formatDateDisplay(safeExpirationDate)}</span>
              </div>
            )}
          </div>
          <FormDescription>
            {expirationDateOption === 'specific' 
              ? "Select a specific expiration date"
              : `Expiration date: ${getDateOptionLabel(expirationDateOption).toLowerCase()}`
            }
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="reviewDate">
          <FormLabel>
            Review Date
            {showReviewDateWarning && (
              <span className={styles.warningIndicator} title="Review date is recommended for policy maintenance">
                <AlertTriangle size={14} />
              </span>
            )}
          </FormLabel>
          
          <div className={styles.durationDateContainer}>
            <Select value={reviewDateOption} onValueChange={handleReviewDateOptionChange}>
              <SelectTrigger className={styles.durationSelect}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1year">1 Year from Effective</SelectItem>
                <SelectItem value="2years">2 Years from Effective</SelectItem>
                <SelectItem value="3years">3 Years from Effective</SelectItem>
                <SelectItem value="4years">4 Years from Effective</SelectItem>
                <SelectItem value="5years">5 Years from Effective</SelectItem>
                <SelectItem value="specific">Custom Date</SelectItem>
              </SelectContent>
            </Select>
            
            {reviewDateOption === 'specific' && (
              <FormControl>
                <DateDropdownSelector
                  value={safeReviewDate}
                  onChange={onReviewDateChange}
                />
              </FormControl>
            )}
            
            {reviewDateOption !== 'specific' && safeReviewDate && (
              <div className={styles.calculatedDate}>
                <CalendarIcon size={16} />
                <span>{formatDateDisplay(safeReviewDate)}</span>
              </div>
            )}
          </div>
          
          <FormDescription>
            {reviewDateOption === 'specific' 
              ? "Select a specific review date"
              : `Review date: ${getDateOptionLabel(reviewDateOption).toLowerCase()}`
            }
            {showReviewDateWarning && (
              <span className={styles.warningText}>
                <br />Setting a review date is recommended for policy maintenance
              </span>
            )}
            {!isReviewDateValid && safeReviewDate && (
              <span className={styles.warningText}>
                <br />Review date cannot be earlier than effective date or expiration date
              </span>
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </div>

      <PolicyTaxonomyGroup
        department={department}
        onDepartmentChange={onDepartmentChange}
        category={category}
        onCategoryChange={onCategoryChange}
        tags={tags}
        onTagsChange={onTagsChange}
      />

      {/* Acknowledgment Requirements - Read-only display */}
      <div className={styles.acknowledgmentSection}>
        <h4 className={styles.sectionTitle}>Acknowledgment Requirements</h4>
        
        {assignedPortals && assignedPortals.length > 0 ? (
          <>
            {assignedPortals.some(p => p.requiresAcknowledgment) ? (
              <div className={styles.acknowledgmentDisplay}>
                <p className={styles.infoText}>
                  This policy requires acknowledgment through the following portals:
                </p>
                <div className={styles.portalBadges}>
                  {assignedPortals
                    .filter(p => p.requiresAcknowledgment)
                    .map(portal => (
                      <Badge key={portal.id} variant="default" className={styles.portalBadge}>
                        {portal.name}
                        {portal.acknowledgmentDueDays && (
                          <span className={styles.dueDaysText}>
                            {' '}(due in {portal.acknowledgmentDueDays} {portal.acknowledgmentDueDays === 1 ? 'day' : 'days'})
                          </span>
                        )}
                      </Badge>
                    ))}
                </div>
                
                {acknowledgmentMode && (
                  <FormItem name="acknowledgmentMode">
                    <FormLabel>Acknowledgment Mode</FormLabel>
                    <FormControl>
                      <Select 
                        value={acknowledgmentMode || 'simple'} 
                        onValueChange={onAcknowledgmentModeChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Simple: Users just click to acknowledge. Quiz: Users must answer questions to confirm understanding.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              </div>
            ) : (
              <div className={styles.noAcknowledgment}>
                <p className={styles.infoText}>
                  No acknowledgment required. None of the assigned portals require acknowledgment.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noAcknowledgment}>
            <p className={styles.infoText}>
              No acknowledgment required. This policy is not assigned to any portals that require acknowledgment.
            </p>
          </div>
        )}
      </div>

      <div className={styles.portalSection}>
        <h4 className={styles.sectionTitle}>Portal Assignment</h4>
        <FormItem name="portalIds">
          <FormLabel>Assign to Portals</FormLabel>
          <FormControl>
            <PortalSelector
              selectedPortalIds={portalIds}
              onPortalIdsChange={onPortalIdsChange}
            />
          </FormControl>
          <FormDescription>
            Select which portals this policy should appear in
          </FormDescription>
          <FormMessage />
        </FormItem>
      </div>

      <FormItem name="versionNotes">
        <FormLabel>Version Notes</FormLabel>
        <FormControl>
          <Textarea
            value={versionNotes}
            onChange={(e) => onVersionNotesChange(e.target.value)}
            placeholder="Describe what's new or changed in this version..."
            rows={3}
            aria-describedby="version-notes-description"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
};