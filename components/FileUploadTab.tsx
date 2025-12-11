import React, { useState, useEffect } from 'react';
import { FileDropzone } from './FileDropzone';
import { Button } from './Button';
import { Progress } from './Progress';
import { Skeleton } from './Skeleton';
import { FileText, Upload, CheckCircle, AlertCircle, Cloud, Search, X, File } from 'lucide-react';
import { postParseDocument } from '../endpoints/policies/parse-document_POST.schema';
import { getGoogleDriveFiles, GoogleDriveFile } from '../endpoints/google-drive/list_GET.schema';
import { postDownloadGoogleDriveFile } from '../endpoints/google-drive/download-file_POST.schema';
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
  
  const [showGoogleDriveBrowser, setShowGoogleDriveBrowser] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean | null>(null);
  const [googleDriveSearch, setGoogleDriveSearch] = useState('');

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    await processLocalFile(file);
  };

  const processLocalFile = async (file: File) => {
    setUploadedFile(file);
    setUploadState('uploading');
    setErrorMessage(null);
    setUploadProgress(0);

    try {
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

  const handleGoogleDriveOpen = async () => {
    setShowGoogleDriveBrowser(true);
    setGoogleDriveLoading(true);
    setErrorMessage(null);
    
    try {
      const result = await getGoogleDriveFiles();
      setGoogleDriveConnected(result.connected);
      setGoogleDriveFiles(result.files);
    } catch (error) {
      console.error('Google Drive error:', error);
      setGoogleDriveConnected(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to Google Drive');
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleGoogleDriveSearch = async () => {
    setGoogleDriveLoading(true);
    try {
      const result = await getGoogleDriveFiles(googleDriveSearch || undefined);
      setGoogleDriveFiles(result.files);
    } catch (error) {
      console.error('Google Drive search error:', error);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleGoogleDriveFileSelect = async (file: GoogleDriveFile) => {
    setShowGoogleDriveBrowser(false);
    setUploadState('processing');
    setUploadProgress(50);
    setErrorMessage(null);
    
    try {
      const result = await postDownloadGoogleDriveFile(file.id);
      
      setExtractedContent({
        title: result.title || 'Untitled Policy',
        content: result.content,
      });
      setUploadState('success');
      setUploadProgress(100);
    } catch (error) {
      console.error('Google Drive file download error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download file from Google Drive');
      setUploadState('error');
      setUploadProgress(0);
    }
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
    setShowGoogleDriveBrowser(false);
    setGoogleDriveFiles([]);
    setGoogleDriveSearch('');
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Upload Policy Document</h3>
        <p className={styles.description}>
          Upload a .docx or .pdf file from your computer or import from Google Drive to automatically extract and populate the policy content.
        </p>
      </div>

      {uploadState === 'idle' && !showGoogleDriveBrowser && (
        <div className={styles.uploadOptions}>
          <div className={styles.localUploadSection}>
            <FileDropzone
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              maxSize={20 * 1024 * 1024}
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
              onClick={handleGoogleDriveOpen}
              className={styles.googleDriveButton}
              size="lg"
            >
              <Cloud size={20} />
              Import from Google Drive
            </Button>
            <p className={styles.googleDriveDescription}>
              Select a .docx or .pdf file from your Google Drive
            </p>
          </div>
        </div>
      )}

      {showGoogleDriveBrowser && uploadState === 'idle' && (
        <div className={styles.googleDriveBrowser}>
          <div className={styles.browserHeader}>
            <h4>Select a file from Google Drive</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowGoogleDriveBrowser(false)}>
              <X size={16} />
            </Button>
          </div>
          
          {googleDriveConnected === false && (
            <div className={styles.notConnectedMessage}>
              <AlertCircle size={24} />
              <p>Google Drive is not connected. Please connect your Google Drive account in the Replit integrations panel.</p>
              <Button variant="outline" onClick={() => setShowGoogleDriveBrowser(false)}>
                Close
              </Button>
            </div>
          )}
          
          {googleDriveConnected !== false && (
            <>
              <div className={styles.searchBar}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={googleDriveSearch}
                  onChange={(e) => setGoogleDriveSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGoogleDriveSearch()}
                />
                <Button size="sm" onClick={handleGoogleDriveSearch}>Search</Button>
              </div>
              
              {googleDriveLoading ? (
                <div className={styles.loadingFiles}>
                  <Skeleton style={{ height: '3rem', width: '100%' }} />
                  <Skeleton style={{ height: '3rem', width: '100%' }} />
                  <Skeleton style={{ height: '3rem', width: '100%' }} />
                </div>
              ) : (
                <div className={styles.fileList}>
                  {googleDriveFiles.length === 0 ? (
                    <p className={styles.noFiles}>No .docx or .pdf files found</p>
                  ) : (
                    googleDriveFiles.map((file) => (
                      <button
                        key={file.id}
                        className={styles.fileItem}
                        onClick={() => handleGoogleDriveFileSelect(file)}
                      >
                        <File size={20} />
                        <div className={styles.fileInfo}>
                          <span className={styles.fileName}>{file.name}</span>
                          <span className={styles.fileMeta}>
                            {formatFileSize(file.size)} • {formatDate(file.modifiedTime)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
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
                {uploadedFile?.name || 'Google Drive file'}
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
                Content extracted from {uploadedFile?.name || 'Google Drive file'}
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
