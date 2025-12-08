import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Google Drive integration not available');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listGoogleDriveFiles(query?: string) {
  const drive = await getGoogleDriveClient();
  
  let q = "mimeType='application/pdf' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/msword'";
  
  if (query) {
    q = `(${q}) and name contains '${query}'`;
  }
  
  const response = await drive.files.list({
    q,
    pageSize: 50,
    fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)',
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

export async function downloadGoogleDriveFile(fileId: string) {
  const drive = await getGoogleDriveClient();
  
  const fileMetadata = await drive.files.get({
    fileId,
    fields: 'name, mimeType',
  });
  
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  
  return {
    name: fileMetadata.data.name || 'unknown',
    mimeType: fileMetadata.data.mimeType || 'application/octet-stream',
    data: Buffer.from(response.data as ArrayBuffer),
  };
}

export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}
