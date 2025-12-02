import React, { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { Button } from './Button';
import { Progress } from './Progress';
import { Skeleton } from './Skeleton';
import { FileText, Upload, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import { postParseDocument } from '../endpoints/policies/parse-document_POST.schema';
import { useGoogleDrivePicker } from '../helpers/useGoogleDrivePicker';
import styles from './FileUploadTab.module.css';

interface FileUploadTabProps {
  onContentExtracted: (title: string, content: string) => void;
  className?: string;
}

export const FileUploadTab: React.FC<FileUploadTabProps> = ({
  onContentExtracted,
  className,
}) => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<{ title: string; content: string } | null>(null);

  const { openPicker, isLoading: isPickerLoading, error: pickerError } = useGoogleDrivePicker();

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setUploadState('uploading');
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('document', file);

      setUploadState('processing');
      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await postParseDocument(formData);

      setExtractedContent({
        title: result.title || 'Untitled Policy',
        content: result.content,
      });
      setUploadState('success');
    } catch (error) {
      console.error('Document parsing error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse document');
      setUploadState('error');
      setUploadProgress(0);
    }
  };

  const handleGoogleDriveImport = () => {
    openPicker((file) => {
      processFile(file);
    });
  };

  const handleUseContent = () => {
    if (extractedContent) {
      onContentExtracted(extractedContent.title, extractedContent.content);
    }
  };

  const handleReset = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setErrorMessage(null);
    setUploadedFile(null);
    setExtractedContent(null);
  };

  // Show picker errors
  React.useEffect(() => {
    if (pickerError) {
      setErrorMessage(pickerError);
      setUploadState('error');
    }
  }, [pickerError]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upload Policy Document</h3>
        <p className={styles.description}>
          Upload a .docx or .pdf file from your computer or import from Google Drive to automatically extract and populate the policy content.
        </p>
      </div>

      {uploadState === 'idle' && (
        <div className={styles.uploadOptions}>
          <div className={styles.localUploadSection}>
            <FileDropzone
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              maxSize={20 * 1024 * 1024} // 20MB
              onFilesSelected={handleFileUpload}
              icon={<Upload size={48} />}
              title="Drop your .docx or .pdf file here or click to browse"
              subtitle="Maximum file size: 20MB"
            />
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerText}>OR</span>
          </div>

          <div className={styles.googleDriveSection}>
            <Button
              onClick={handleGoogleDriveImport}
              disabled={isPickerLoading}
              className={styles.googleDriveButton}
              size="lg"
            >
              <Cloud size={20} />
              {isPickerLoading ? 'Loading...' : 'Import from Google Drive'}
            </Button>
            <p className={styles.googleDriveDescription}>
              Select a .docx or .pdf file from your Google Drive
            </p>
          </div>
        </div>
      )}

      {(uploadState === 'uploading' || uploadState === 'processing') && (
        <div className={styles.uploadingState}>
          <div className={styles.uploadingHeader}>
            <FileText size={24} className={styles.uploadingIcon} />
            <div>
              <h4 className={styles.uploadingTitle}>
                {uploadState === 'uploading' ? 'Uploading...' : 'Processing document...'}
              </h4>
              <p className={styles.uploadingSubtitle}>
                {uploadedFile?.name}
              </p>
            </div>
          </div>
          <Progress value={uploadProgress} />
          {uploadState === 'processing' && (
            <div className={styles.processingIndicator}>
              <Skeleton style={{ height: '1rem', width: '60%' }} />
              <Skeleton style={{ height: '1rem', width: '80%' }} />
              <Skeleton style={{ height: '1rem', width: '40%' }} />
            </div>
          )}
        </div>
      )}

      {uploadState === 'success' && extractedContent && (
        <div className={styles.successState}>
          <div className={styles.successHeader}>
            <CheckCircle size={24} className={styles.successIcon} />
            <div>
              <h4 className={styles.successTitle}>Document processed successfully!</h4>
              <p className={styles.successSubtitle}>
                Content extracted from {uploadedFile?.name}
              </p>
            </div>
          </div>
          
          <div className={styles.previewSection}>
            <h5 className={styles.previewTitle}>Extracted Title:</h5>
            <p className={styles.previewText}>{extractedContent.title}</p>
            
            <h5 className={styles.previewTitle}>Content Preview:</h5>
            <div 
              className={styles.previewContent}
              dangerouslySetInnerHTML={{ 
                __html: extractedContent.content.substring(0, 500) + '...' 
              }}
            />
          </div>

          <div className={styles.successActions}>
            <Button onClick={handleUseContent}>
              Use This Content
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Upload Different File
            </Button>
          </div>
        </div>
      )}

      {uploadState === 'error' && (
        <div className={styles.errorState}>
          <div className={styles.errorHeader}>
            <AlertCircle size={24} className={styles.errorIcon} />
            <div>
              <h4 className={styles.errorTitle}>Upload failed</h4>
              <p className={styles.errorMessage}>{errorMessage}</p>
            </div>
          </div>
          <div className={styles.errorActions}>
            <Button onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};