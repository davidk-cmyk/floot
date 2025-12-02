import { useState, useEffect, useCallback } from 'react';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_PICKER_API_KEY } from './_publicConfigs';
import { postGoogleDriveDownload } from '../endpoints/google-drive/download_POST.schema';

// Declare global google types
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
      picker: {
        PickerBuilder: {
          new (): {
            addView: (view: any) => any;
            setOAuthToken: (token: string) => any;
            setDeveloperKey: (key: string) => any;
            setOrigin: (origin: string) => any;
            setCallback: (callback: (data: any) => void) => any;
            setTitle: (title: string) => any;
            build: () => { setVisible: (visible: boolean) => void };
          };
        };
        DocsView: {
          new (): {
            setIncludeFolders: (include: boolean) => any;
            setMimeTypes: (types: string) => any;
          };
        };
        ViewId: {
          DOCS: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
  }
}

interface PickerResult {
  action: string;
  docs?: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes?: number;
  }>;
}

const PICKER_SCRIPT_URL = 'https://apis.google.com/js/api.js';
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';
const PDF_MIME = 'application/pdf';

export const useGoogleDrivePicker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load Google Picker and GSI scripts
  useEffect(() => {
    const loadScript = (src: string, id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    const initScripts = async () => {
      try {
        await Promise.all([
          loadScript(PICKER_SCRIPT_URL, 'google-picker-api'),
          loadScript(GSI_SCRIPT_URL, 'google-gsi-client'),
        ]);

        // Wait for gapi to be ready
        if (window.gapi) {
          window.gapi.load('picker', () => {
            // Verify that the picker API is actually available before marking as loaded
            if (window.google?.picker) {
              console.log('Google Picker API loaded successfully');
              setIsScriptLoaded(true);
            } else {
              console.error('Google Picker API loaded but picker object not found');
              setError('Failed to initialize Google Drive integration');
            }
          });
        }
      } catch (err) {
        console.error('Failed to load Google scripts:', err);
        setError('Failed to load Google Drive integration');
      }
    };

    initScripts();
  }, []);

  const requestAccessToken = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('OAuth error:', response.error);
            reject(new Error('Failed to authenticate with Google Drive'));
            return;
          }
          if (response.access_token) {
            setAccessToken(response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        },
      });

      tokenClient.requestAccessToken();
    });
  }, []);

  const openPicker = useCallback(
    async (onFileSelected: (file: File) => void) => {
      if (!isScriptLoaded) {
        setError('Google Picker is not ready yet. Please try again.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get access token
        let token = accessToken;
        if (!token) {
          token = await requestAccessToken();
        }

        if (!window.google?.picker) {
          throw new Error('Google Picker API not available');
        }

        // Create picker view
        const docsView = new window.google.picker.DocsView()
          .setIncludeFolders(false)
          .setMimeTypes(`${DOCX_MIME},${DOC_MIME},${PDF_MIME}`);

        // Create and show picker
        const picker = new window.google.picker.PickerBuilder()
          .addView(docsView)
          .setOAuthToken(token)
          .setDeveloperKey(GOOGLE_PICKER_API_KEY)
          .setOrigin(window.location.origin)
          .setTitle('Select a Document')
          .setCallback(async (data: PickerResult) => {
            if (data.action === window.google!.picker.Action.PICKED && data.docs && data.docs.length > 0) {
              const doc = data.docs[0];
              console.log('File selected from Google Drive:', doc);

              try {
                // Download file via proxy endpoint
                const response = await postGoogleDriveDownload({
                  fileId: doc.id,
                  accessToken: token!,
                });

                // Convert response to File object
                const blob = await response.blob();
                const file = new File([blob], doc.name, {
                  type: doc.mimeType,
                });

                console.log('File downloaded successfully:', file.name);
                onFileSelected(file);
              } catch (err) {
                console.error('Failed to download file from Google Drive:', err);
                setError(err instanceof Error ? err.message : 'Failed to download file from Google Drive');
              }
            } else if (data.action === window.google!.picker.Action.CANCEL) {
              console.log('User cancelled picker');
            }
          })
          .build();

        picker.setVisible(true);
      } catch (err) {
        console.error('Error opening Google Drive picker:', err);
        setError(err instanceof Error ? err.message : 'Failed to open Google Drive picker');
      } finally {
        setIsLoading(false);
      }
    },
    [isScriptLoaded, accessToken, requestAccessToken]
  );

  return {
    openPicker,
    isLoading,
    error,
    isScriptLoaded,
  };
};