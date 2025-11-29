import { useState, useEffect, useCallback } from 'react';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const APP_DATA_FILENAME = 'kvideo_data.json';

// Type declarations for gapi
declare const gapi: any;

export interface GoogleUser {
    name: string;
    email: string;
    imageUrl: string;
}

export interface DriveFile {
    id: string;
    name: string;
    modifiedTime?: string;
}

export function useGoogleDrive() {
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        const initClient = async () => {
            try {
                // Dynamically load gapi script
                if (!window.gapi) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://apis.google.com/js/api.js';
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load gapi script'));
                        document.body.appendChild(script);
                    });
                }

                await new Promise<void>((resolve) => {
                    gapi.load('client:auth2', () => {
                        resolve();
                    });
                });

                await gapi.client.init({
                    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                });

                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

                // Handle the initial sign-in state.
                updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                setIsInitialized(true);
            } catch (err: any) {
                console.error('Error initializing Google API client', err);
                setError(err.message || 'Failed to initialize Google API');
            }
        };

        if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
            initClient();
        } else {
            setError('Missing Google Client ID');
        }
    }, []);

    const updateSigninStatus = (isSignedIn: boolean) => {
        if (isSignedIn) {
            const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
            setUser({
                name: profile.getName(),
                email: profile.getEmail(),
                imageUrl: profile.getImageUrl(),
            });
        } else {
            setUser(null);
        }
    };

    const signIn = async () => {
        try {
            await gapi.auth2.getAuthInstance().signIn();
        } catch (err: any) {
            console.error('Error signing in', err);
            setError(err.message || 'Failed to sign in');
        }
    };

    const signOut = async () => {
        try {
            await gapi.auth2.getAuthInstance().signOut();
        } catch (err: any) {
            console.error('Error signing out', err);
            setError(err.message || 'Failed to sign out');
        }
    };

    const findAppDataFile = useCallback(async (): Promise<DriveFile | null> => {
        try {
            const response = await gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                fields: 'nextPageToken, files(id, name, modifiedTime)',
                q: `name = '${APP_DATA_FILENAME}'`,
                pageSize: 1,
            });
            const files = response.result.files;
            if (files && files.length > 0) {
                return files[0] as DriveFile;
            }
            return null;
        } catch (err: any) {
            console.error('Error finding app data file', err);
            throw err;
        }
    }, []);

    const uploadData = useCallback(async (data: string) => {
        setIsLoading(true);
        try {
            const file = await findAppDataFile();
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const contentType = 'application/json';
            const metadata = {
                'name': APP_DATA_FILENAME,
                'mimeType': contentType,
                'parents': !file ? ['appDataFolder'] : undefined // Only set parent on create
            };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n\r\n' +
                data +
                close_delim;

            const request = gapi.client.request({
                'path': file ? `/upload/drive/v3/files/${file.id}` : '/upload/drive/v3/files',
                'method': file ? 'PATCH' : 'POST',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });

            await request;
            console.log('Data uploaded successfully');
        } catch (err: any) {
            console.error('Error uploading data', err);
            setError(err.message || 'Failed to upload data');
        } finally {
            setIsLoading(false);
        }
    }, [findAppDataFile]);

    const downloadData = useCallback(async (): Promise<string | null> => {
        setIsLoading(true);
        try {
            const file = await findAppDataFile();
            if (!file) return null;

            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media',
            });
            return JSON.stringify(response.result); // gapi returns the parsed JSON in result for 'media' alt? 
            // Actually gapi.client.drive.files.get with alt='media' returns the body in `body` or `result` depending on content type.
            // For JSON it should be in result.
        } catch (err: any) {
            console.error('Error downloading data', err);
            setError(err.message || 'Failed to download data');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [findAppDataFile]);

    return {
        user,
        isInitialized,
        isLoading,
        error,
        signIn,
        signOut,
        uploadData,
        downloadData,
    };
}
