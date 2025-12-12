import { google } from 'googleapis';
import { db } from './db';
import { GoogleDriveOAuthProvider } from './GoogleDriveOAuthProvider';

async function getAccessTokenForUser(userId: number): Promise<string> {
  const connection = await db
    .selectFrom("userGoogleDriveConnections")
    .select(["accessToken", "refreshToken", "expiresAt"])
    .where("userId", "=", userId)
    .executeTakeFirst();

  if (!connection) {
    throw new Error('Google Drive not connected. Please connect your Google Drive first.');
  }

  const now = new Date();
  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt) : null;
  const isExpired = expiresAt && expiresAt <= now;

  if (isExpired && connection.refreshToken) {
    console.log('Google Drive access token expired, refreshing...');
    try {
      const provider = new GoogleDriveOAuthProvider('');
      const newTokens = await provider.refreshAccessToken(connection.refreshToken);
      
      const newExpiresAt = newTokens.expiresIn
        ? new Date(Date.now() + newTokens.expiresIn * 1000)
        : null;

      await db
        .updateTable("userGoogleDriveConnections")
        .set({
          accessToken: newTokens.accessToken,
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where("userId", "=", userId)
        .execute();

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh Google Drive token:', error);
      throw new Error('Google Drive session expired. Please reconnect your Google Drive.');
    }
  }

  return connection.accessToken;
}

export async function getGoogleDriveClientForUser(userId: number) {
  const accessToken = await getAccessTokenForUser(userId);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listGoogleDriveFilesForUser(userId: number, query?: string) {
  const drive = await getGoogleDriveClientForUser(userId);
  
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

export async function downloadGoogleDriveFileForUser(userId: number, fileId: string) {
  const drive = await getGoogleDriveClientForUser(userId);
  
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

export async function isGoogleDriveConnectedForUser(userId: number): Promise<boolean> {
  const connection = await db
    .selectFrom("userGoogleDriveConnections")
    .select("id")
    .where("userId", "=", userId)
    .executeTakeFirst();
    
  return !!connection;
}

export async function getGoogleDriveClient() {
  throw new Error('Per-user Google Drive is now required. Use getGoogleDriveClientForUser(userId) instead.');
}

export async function listGoogleDriveFiles(query?: string) {
  throw new Error('Per-user Google Drive is now required. Use listGoogleDriveFilesForUser(userId, query) instead.');
}

export async function downloadGoogleDriveFile(fileId: string) {
  throw new Error('Per-user Google Drive is now required. Use downloadGoogleDriveFileForUser(userId, fileId) instead.');
}

export async function isGoogleDriveConnected(): Promise<boolean> {
  throw new Error('Per-user Google Drive is now required. Use isGoogleDriveConnectedForUser(userId) instead.');
}
