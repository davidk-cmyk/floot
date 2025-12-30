import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { Wand2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useGeneratePolicy } from '../helpers/useAIPolicyApi';
import { schema as generatePolicySchema } from '../endpoints/ai/generate-policy_POST.schema';
import { useOrgNavigation } from '../helpers/useOrgNavigation';
import { Form, FormControl, FormItem, FormLabel, FormMessage, FormDescription, useForm } from './Form';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { PolicyTaxonomyGroup } from './PolicyTaxonomyGroup';
import { DateDropdownSelector } from './DateDropdownSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import styles from './AIPolicyGenerator.module.css';

type DateDurationOption = 'specific' | '1year' | '2years' | '3years' | '4years' | '5years';

// Extended schema for enhanced form features
const enhancedGeneratePolicySchema = generatePolicySchema.extend({
  effectiveDate: z.date().optional(),
  reviewDate: z.date().optional(),
  expirationDate: z.date().optional(),
  versionNotes: z.string().optional(),
});

type EnhancedGeneratePolicyFormValues = z.infer<typeof enhancedGeneratePolicySchema>;

interface PolicyMetadata {
  department?: string;
  category?: string;
  tags?: string[];
  effectiveDate?: Date;
  reviewDate?: Date;
  expirationDate?: Date;
  versionNotes?: string;
}

type AIPolicyGeneratorProps = {
  onPolicyGenerated: (content: string, metadata?: PolicyMetadata, switchToManual?: boolean) => void;
  className?: string;
  initialValues?: Partial<EnhancedGeneratePolicyFormValues>;
};

export const AIPolicyGenerator = ({ onPolicyGenerated, className, initialValues }: AIPolicyGeneratorProps) => {
  const [generatedContent, setGeneratedContent] = useState('');
  const [isStreamingContent, setIsStreamingContent] = useState(false);
  const [reviewDateOption, setReviewDateOption] = useState<DateDurationOption>('1year');
  const [expirationDateOption, setExpirationDateOption] = useState<DateDurationOption>('1year');
  const outputRef = useRef<HTMLTextAreaElement>(null);
  
  const { buildUrl } = useOrgNavigation();
  const { mutate: generatePolicy, isPending, data: stream, error } = useGeneratePolicy();

  const form = useForm({
    schema: enhancedGeneratePolicySchema,
    defaultValues: {
      topic: initialValues?.topic || '',
      department: initialValues?.department || '',
      category: initialValues?.category || '',
      keyRequirements: initialValues?.keyRequirements || '',
      tags: initialValues?.tags || [],
      effectiveDate: initialValues?.effectiveDate || undefined,
      reviewDate: initialValues?.reviewDate || undefined,
      expirationDate: initialValues?.expirationDate || undefined,
      versionNotes: initialValues?.versionNotes || '',
    },
  });

  const safeEffectiveDate = useMemo(() => {
    const value = form.values.effectiveDate;
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, [form.values.effectiveDate]);

  const safeReviewDate = useMemo(() => {
    const value = form.values.reviewDate;
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, [form.values.reviewDate]);

  const safeExpirationDate = useMemo(() => {
    const value = form.values.expirationDate;
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }, [form.values.expirationDate]);

  const calculateDateFromEffective = useCallback((option: DateDurationOption, baseDate?: Date | null): Date | null => {
    if (option === 'specific' || !baseDate) return null;
    const years = { '1year': 1, '2years': 2, '3years': 3, '4years': 4, '5years': 5 }[option];
    if (!years) return null;
    const calculatedDate = new Date(baseDate);
    calculatedDate.setFullYear(calculatedDate.getFullYear() + years);
    return calculatedDate;
  }, []);

  useEffect(() => {
    if (reviewDateOption !== 'specific' && safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(reviewDateOption, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeReviewDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          form.setValues((prev) => ({ ...prev, reviewDate: calculatedDate }));
        }
      }
    }
  }, [safeEffectiveDate, reviewDateOption, calculateDateFromEffective, safeReviewDate, form.setValues]);

  useEffect(() => {
    if (expirationDateOption !== 'specific' && safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(expirationDateOption, safeEffectiveDate);
      if (calculatedDate) {
        const currentTimestamp = safeExpirationDate?.getTime();
        const calculatedTimestamp = calculatedDate.getTime();
        if (currentTimestamp !== calculatedTimestamp) {
          form.setValues((prev) => ({ ...prev, expirationDate: calculatedDate }));
        }
      }
    }
  }, [safeEffectiveDate, expirationDateOption, calculateDateFromEffective, safeExpirationDate, form.setValues]);

  const handleReviewDateOptionChange = (option: DateDurationOption) => {
    setReviewDateOption(option);
    if (option === 'specific') return;
    if (safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(option, safeEffectiveDate);
      if (calculatedDate) {
        form.setValues((prev) => ({ ...prev, reviewDate: calculatedDate }));
      }
    }
  };

  const handleExpirationDateOptionChange = (option: DateDurationOption) => {
    setExpirationDateOption(option);
    if (option === 'specific') return;
    if (safeEffectiveDate) {
      const calculatedDate = calculateDateFromEffective(option, safeEffectiveDate);
      if (calculatedDate) {
        form.setValues((prev) => ({ ...prev, expirationDate: calculatedDate }));
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

  const formatDateDisplay = (value: Date | null): string => {
    return value ? value.toLocaleDateString() : 'Pick a date';
  };

  const handleSubmit = (values: EnhancedGeneratePolicyFormValues) => {
    setGeneratedContent('');
    setIsStreamingContent(false);
    
    // Only pass the fields that the API expects
    const apiValues = {
      topic: values.topic,
      department: values.department,
      category: values.category,
      keyRequirements: values.keyRequirements,
      tags: values.tags,
    };
    
    generatePolicy(apiValues);
  };

  const readStream = useCallback(async () => {
    if (!stream) return;

    const reader = stream.getReader();
    setIsStreamingContent(true);
    let fullContent = '';
    let buffer = '';
    let receivedMarker = false;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        if (typeof value === 'string') {
          buffer += value;
          
          // Parse SSE format - look for complete messages ending with \n\n
          const messages = buffer.split('\n\n');
          // Keep the last incomplete message in the buffer
          buffer = messages.pop() || '';
          
          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const content = message.substring(6); // Remove 'data: ' prefix
              
              if (content === '__VARIABLES_PROCESSED__') {
                receivedMarker = true;
                // Next data chunk will be the processed content
              } else if (receivedMarker) {
                // This is the final processed content with variables replaced
                // JSON decode to restore multi-line content that was JSON encoded
                try {
                  const decodedContent = JSON.parse(content);
                  setGeneratedContent(decodedContent);
                } catch (e) {
                  console.error('Error parsing processed content:', e);
                  setGeneratedContent(content); // Fallback to raw content
                }
                receivedMarker = false;
                break; // We have the final version
              } else {
                // Stream raw content in real-time
                fullContent += content;
                setGeneratedContent(fullContent);
              }
            }
          }
          
          if (receivedMarker) {
            break; // We've received and processed the final content
          }
        }
      }
    } catch (e) {
      console.error('Error reading stream:', e);
    } finally {
      reader.releaseLock();
      setIsStreamingContent(false);
    }
  }, [stream]);

  useEffect(() => {
    if (stream) {
      readStream();
    }
  }, [stream, readStream]);

  // Auto-scroll to bottom as new content streams in
  useEffect(() => {
    if (outputRef.current && generatedContent) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedContent]);

  const handleAccept = () => {
    const metadata: PolicyMetadata = {
      department: form.values.department,
      category: form.values.category,
      tags: form.values.tags,
      effectiveDate: form.values.effectiveDate,
      reviewDate: form.values.reviewDate,
      expirationDate: form.values.expirationDate,
      versionNotes: form.values.versionNotes,
    };
    
    onPolicyGenerated(generatedContent, metadata, true);
    setGeneratedContent('');
    form.setValues({
      topic: '',
      department: '',
      category: '',
      keyRequirements: '',
      tags: [],
      effectiveDate: undefined,
      reviewDate: undefined,
      expirationDate: undefined,
      versionNotes: '',
    });
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <FormItem name="topic">
            <FormLabel>Policy Topic *</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Remote Work Policy"
                value={form.values.topic}
                onChange={(e) => form.setValues(prev => ({ ...prev, topic: e.target.value }))}
                disabled={isPending}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="keyRequirements">
            <FormLabel>Key Requirements</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any specific points, rules, or sections to include."
                value={form.values.keyRequirements}
                onChange={(e) => form.setValues(prev => ({ ...prev, keyRequirements: e.target.value }))}
                rows={4}
                disabled={isPending}
              />
            </FormControl>
            <FormDescription>
              Describe the specific requirements, rules, or sections that should be included in the policy.
            </FormDescription>
            <FormMessage />
          </FormItem>

          <PolicyTaxonomyGroup
            department={form.values.department || ''}
            onDepartmentChange={(value) => form.setValues(prev => ({ ...prev, department: value }))}
            category={form.values.category || ''}
            onCategoryChange={(value) => form.setValues(prev => ({ ...prev, category: value }))}
            tags={form.values.tags || []}
            onTagsChange={(tags) => form.setValues(prev => ({ ...prev, tags }))}
            disabled={isPending}
          />

          <div className={styles.dateFields}>
            <FormItem name="effectiveDate">
              <FormLabel>Effective Date</FormLabel>
              <FormControl>
                <DateDropdownSelector
                  value={form.values.effectiveDate}
                  onChange={(date) => form.setValues((prev) => ({ ...prev, effectiveDate: date || undefined }))}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Select the date when this policy becomes effective
              </FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="reviewDate">
              <FormLabel>Review Date</FormLabel>
              <div className={styles.durationDateContainer}>
                <Select value={reviewDateOption} onValueChange={handleReviewDateOptionChange} disabled={isPending}>
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
                      value={form.values.reviewDate}
                      onChange={(date) => form.setValues((prev) => ({ ...prev, reviewDate: date || undefined }))}
                      disabled={isPending}
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
              </FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="expirationDate">
              <FormLabel>Expiration Date</FormLabel>
              <div className={styles.durationDateContainer}>
                <Select value={expirationDateOption} onValueChange={handleExpirationDateOptionChange} disabled={isPending}>
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
                      value={form.values.expirationDate}
                      onChange={(date) => form.setValues((prev) => ({ ...prev, expirationDate: date || undefined }))}
                      disabled={isPending}
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
          </div>

          <FormItem name="versionNotes">
            <FormLabel>Version Notes</FormLabel>
            <FormControl>
              <Textarea
                value={form.values.versionNotes || ''}
                onChange={(e) => form.setValues((prev) => ({ ...prev, versionNotes: e.target.value }))}
                placeholder="Describe what's new or changed in this version..."
                rows={3}
                disabled={isPending}
              />
            </FormControl>
            <FormDescription>
              Optional notes about this version of the policy
            </FormDescription>
            <FormMessage />
          </FormItem>

          <Button type="submit" disabled={isPending}>
            <Wand2 size={16} />
            {isPending ? 'Generating...' : 'Generate and Manually Review'}
          </Button>
        </form>
      </Form>

      <div className={styles.outputSection}>
        <h3 className={styles.outputTitle}>Generated Policy</h3>
        <div className={styles.outputWrapper}>
          {(isPending || isStreamingContent) && generatedContent.length === 0 && (
            <div className={styles.skeletonContainer}>
              <Skeleton style={{ height: '1.25rem', width: '40%' }} />
              <Skeleton style={{ height: '1rem', width: '90%', marginTop: 'var(--spacing-4)' }} />
              <Skeleton style={{ height: '1rem', width: '85%' }} />
              <Skeleton style={{ height: '1rem', width: '95%' }} />
              <Skeleton style={{ height: '1.25rem', width: '35%', marginTop: 'var(--spacing-4)' }} />
              <Skeleton style={{ height: '1rem', width: '90%' }} />
              <Skeleton style={{ height: '1rem', width: '80%' }} />
            </div>
          )}
          {generatedContent.length > 0 && (
            <Textarea
              ref={outputRef}
              variant="clear"
              value={generatedContent}
              readOnly
              className={styles.outputTextarea}
              style={{ minHeight: '15rem' }}
            />
          )}
          {!isPending && !isStreamingContent && generatedContent.length === 0 && !error && (
            <div className={styles.placeholder}>
              <p>Your generated policy will appear here.</p>
              <p className={styles.placeholderHelp}>
                Need inspiration?{' '}
                <Link to={buildUrl('/admin/policy-templates')} className={styles.templateLink}>
                  Browse our policy templates
                </Link>{' '}
                for ready-made policies you can customize.
              </p>
            </div>
          )}
          {error && <div className={styles.error}>Error: {error.message}</div>}
        </div>
        {generatedContent && !isPending && !isStreamingContent && (
          <div className={styles.actions}>
            <Button onClick={handleAccept} disabled={isPending || isStreamingContent}>Review and Manually Approve</Button>
          </div>
        )}
      </div>
    </div>
  );
};