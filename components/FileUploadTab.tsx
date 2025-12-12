import React, { useState, useEffect } from 'react';
import { FileDropzone } from './FileDropzone';
import { Button } from './Button';
import { Progress } from './Progress';
import { Skeleton } from './Skeleton';
import { FileText, Upload, CheckCircle, AlertCircle, Cloud, Search, X, File, Files } from 'lucide-react';
import { postParseDocument } from '../endpoints/policies/parse-document_POST.schema';
import { postBulkCreatePolicies } from '../endpoints/policies/bulk-create_POST.schema';
import { getGoogleDriveFiles, GoogleDriveFile } from '../endpoints/google-drive/list_GET.schema';
import { postDownloadGoogleDriveFile } from '../endpoints/google-drive/download-file_POST.schema';
import styles from './FileUploadTab.module.css';

interface FileUploadTabProps {
  onContentExtracted: (title: string, content: string) => void;
  onBulkUploadComplete?: (policies: Array<{id: number; title: string}>) => void;
  className?: string;
}

export const FileUploadTab: React.FC<FileUploadTabProps> = ({
  onContentExtracted,
  onBulkUploadComplete,
  className,
}) => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'bulk-processing' | 'bulk-success'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState<{ title: string; content: string } | null>(null);
  
  const [showGoogleDriveBrowser, setShowGoogleDriveBrowser] = useState(false);
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState<boolean | null>(null);
  const [googleDriveSearch, setGoogleDriveSearch] = useState('');

  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    currentFile: string;
  }>({ total: 0, completed: 0, failed: 0, currentFile: '' });

  const [bulkResults, setBulkResults] = useState<{
    created: Array<{id: number; title: string}>;
    failed: Array<{fileName: string; error: string}>;
  } | null>(null);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length === 1) {
      await processLocalFile(files[0]);
    } else {
      await processBulkUpload(files);
    }
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

  const processBulkUpload = async (files: File[]) => {
    setUploadState('bulk-processing');
    setBulkUploadProgress({ total: files.length, completed: 0, failed: 0, currentFile: '' });
    setErrorMessage(null);
    setBulkResults(null);

    const parsedDocuments: Array<{title: string; content: string}> = [];
    const failures: Array<{fileName: string; error: string}> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkUploadProgress(prev => ({ 
        ...prev, 
        currentFile: file.name,
      }));

      try {
        const formData = new FormData();
        formData.append('document', file);
        const result = await postParseDocument(formData);
        
        parsedDocuments.push({
          title: result.title || file.name.replace(/\.(pdf|docx)$/i, ''),
          content: result.content,
        });
        
        setBulkUploadProgress(prev => ({ 
          ...prev, 
          completed: prev.completed + 1 
        }));
      } catch (error) {
        failures.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Parse failed',
        });
        setBulkUploadProgress(prev => ({ 
          ...prev, 
          failed: prev.failed + 1 
        }));
      }
    }

    if (parsedDocuments.length > 0) {
      try {
        const createdPolicies = await postBulkCreatePolicies({ policies: parsedDocuments });
        
        setBulkResults({
          created: createdPolicies.map(p => ({ id: p.id, title: p.title })),
          failed: failures,
        });
        setUploadState('bulk-success');
      } catch (error) {
        setErrorMessage('Failed to create policies: ' + (error instanceof Error ? error.message : 'Unknown error'));
        setUploadState('error');
      }
    } else {
      setErrorMessage(`All ${files.length} files failed to parse`);
      setUploadState('error');
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
    setBulkUploadProgress({ total: 0, completed: 0, failed: 0, currentFile: '' });
    setBulkResults(null);
  };

  const handleViewAllPolicies = () => {
    if (bulkResults && onBulkUploadComplete) {
      onBulkUploadComplete(bulkResults.created);
    }
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
        <h3 className={styles.title}>Upload Policy Documents</h3>
        <p className={styles.description}>
          Upload .docx or .pdf files from your computer or import from Google Drive. 
          Upload one file to edit it directly, or upload multiple files to create them all as draft policies.
        </p>
      </div>

      {uploadState === 'idle' && !showGoogleDriveBrowser && (
        <div className={styles.uploadOptions}>
          <div className={styles.localUploadSection}>
            <FileDropzone
              accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              maxFiles={50}
              maxSize={20 * 1024 * 1024}
              onFilesSelected={handleFileUpload}
              icon={<Upload size={48} />}
              title="Drop your files here or click to browse"
              subtitle="Up to 50 files, 20MB each. Supports .docx and .pdf"
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
              <Cloud size={24} />
              <p>Connect your Google Drive to import documents directly from your cloud storage.</p>
              <Button 
                onClick={() => {
                  const popup = window.open(
                    '/_api/google-drive/authorize',
                    'google-drive-auth',
                    'width=600,height=700,popup=yes'
                  );
                  
                  const handleMessage = (event: MessageEvent) => {
                    if (event.origin === window.location.origin && event.data?.type === 'GOOGLE_DRIVE_OAUTH_RESULT') {
                      window.removeEventListener('message', handleMessage);
                      if (event.data.success) {
                        handleGoogleDriveOpen();
                      } else {
                        setErrorMessage(event.data.error || 'Failed to connect Google Drive');
                      }
                    }
                  };
                  window.addEventListener('message', handleMessage);
                }}
              >
                Connect Google Drive
              </Button>
              <Button variant="outline" onClick={() => setShowGoogleDriveBrowser(false)}>
                Cancel
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

      {uploadState === 'bulk-processing' && (
        <div className={styles.bulkProcessingState}>
          <div className={styles.bulkHeader}>
            <Files size={24} className={styles.uploadingIcon} />
            <div>
              <h4 className={styles.uploadingTitle}>
                Processing {bulkUploadProgress.total} documents...
              </h4>
              <p className={styles.uploadingSubtitle}>
                {bulkUploadProgress.currentFile || 'Preparing...'}
              </p>
            </div>
          </div>
          <Progress 
            value={((bulkUploadProgress.completed + bulkUploadProgress.failed) / bulkUploadProgress.total) * 100} 
          />
          <div className={styles.bulkStats}>
            <span className={styles.completedCount}>
              Completed: {bulkUploadProgress.completed}
            </span>
            {bulkUploadProgress.failed > 0 && (
              <span className={styles.failedCount}>
                Failed: {bulkUploadProgress.failed}
              </span>
            )}
          </div>
        </div>
      )}

      {uploadState === 'bulk-success' && bulkResults && (
        <div className={styles.bulkSuccessState}>
          <div className={styles.successHeader}>
            <CheckCircle size={24} className={styles.successIcon} />
            <div>
              <h4 className={styles.successTitle}>
                {bulkResults.created.length} {bulkResults.created.length === 1 ? 'policy' : 'policies'} created successfully!
              </h4>
              {bulkResults.failed.length > 0 && (
                <p className={styles.failedNote}>
                  {bulkResults.failed.length} file(s) failed to process
                </p>
              )}
            </div>
          </div>
          
          <div className={styles.createdList}>
            <h5 className={styles.listTitle}>Created Policies:</h5>
            <ul className={styles.policyList}>
              {bulkResults.created.map(p => (
                <li key={p.id} className={styles.policyItem}>
                  <FileText size={16} />
                  {p.title}
                </li>
              ))}
            </ul>
          </div>
          
          {bulkResults.failed.length > 0 && (
            <div className={styles.failedList}>
              <h5 className={styles.listTitle}>Failed to process:</h5>
              <ul className={styles.errorList}>
                {bulkResults.failed.map((f, i) => (
                  <li key={i} className={styles.errorItem}>
                    <AlertCircle size={16} />
                    {f.fileName}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.bulkActions}>
            <Button onClick={handleViewAllPolicies}>
              View All Policies
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Upload More
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
