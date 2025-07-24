import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { copyContentUriToCache } from './utils/fileUtils';

// Helper to trigger modals/input dialogs in tabs
export const handleShareIntent = async (sharedData: any, router: any) => {
  if (!sharedData) return;

  try {
    if (sharedData.type === 'photo') {
      // Handle content:// URI by copying to cache
      let localUri = sharedData.data;
      if (localUri && localUri.startsWith('content://')) {
        try {
          localUri = await copyContentUriToCache(localUri);
          console.log('[handleShareIntent] Copied content URI to cache:', localUri);
        } catch (copyErr) {
          console.error('[handleShareIntent] Failed to copy content URI:', copyErr);
          throw copyErr;
        }
      }
      // Route to photos tab and pass local URI, trigger modal
      router.push({ pathname: '/(tabs)/photos', params: { shareUri: localUri, showPhotoModal: true } });
    } else if (sharedData.type === 'link') {
      router.push({ pathname: '/(tabs)/links', params: { shareUrl: sharedData.data, showLinkModal: true } });
    } else if (sharedData.type === 'text') {
      router.push({ pathname: '/(tabs)/notes', params: { shareText: sharedData.data, showNoteModal: true } });
    }
  } catch (error) {
    // Robust error logging
    console.error('[handleShareIntent] Error processing shared data:', error);
    if (error instanceof Error) {
      // Log stack if available
      console.error(error.stack);
    }
  }
};

// Listen for share intents
const ShareIntentHandler: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
    console.log('[ShareIntentHandler] Mounted');
    interface ReceivedFile {
      fileType?: string;
      weblink?: string;
      filePath?: string;
      text?: string;
    }

    type GetReceivedFilesSuccessCallback = (files: ReceivedFile[]) => void;
    type GetReceivedFilesErrorCallback = (error: any) => void;

    ReceiveSharingIntent.getReceivedFiles(
      async (files: ReceivedFile[]) => {
        try {
          console.log('[ShareIntentHandler] Received files:', JSON.stringify(files));
          if (files && files.length > 0) {
            const file: ReceivedFile = files[0];
            console.log('[ShareIntentHandler] Processing file:', JSON.stringify(file));
            if (file.fileType && file.fileType.startsWith('image/')) {
              console.log('[ShareIntentHandler] Detected image');
              await handleShareIntent({ type: 'photo', data: file.weblink || file.filePath }, router);
            } else if (file.text && file.text.startsWith('http')) {
              console.log('[ShareIntentHandler] Detected link');
              await handleShareIntent({ type: 'link', data: file.text }, router);
            } else if (file.text) {
              console.log('[ShareIntentHandler] Detected text');
              await handleShareIntent({ type: 'text', data: file.text }, router);
            } else {
              console.log('[ShareIntentHandler] Unknown file type');
            }
          } else {
            console.log('[ShareIntentHandler] No files received');
          }
        } catch (error) {
          // Robust error logging
          console.error('[ShareIntentHandler] Error in getReceivedFiles callback:', error);
          if (error instanceof Error) {
            console.error(error.stack);
          }
        }
      },
      (error: any) => {
        if (!error) {
          console.error('[ShareIntentHandler] Share intent error: Received null error object');
          return;
        }
        // Filter out known harmless NullPointerException spam from react-native-receive-sharing-intent
        if (
          typeof error === 'object' &&
          error.message &&
          error.message.includes("java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String android.content.Intent.getAction()' on a null object reference")
        ) {
          // Silently ignore this known issue
          return;
        }
        if (
          typeof error === 'string' &&
          error.includes("java.lang.NullPointerException: Attempt to invoke virtual method 'java.lang.String android.content.Intent.getAction()' on a null object reference")
        ) {
          // Silently ignore this known issue
          return;
        }
        console.error('[ShareIntentHandler] Share intent error:', error);
        if (error instanceof Error) {
          console.error(error.stack);
        }
      },
      'KilerShareIntent'
    );
    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, [router]);
  return null;
};

export default ShareIntentHandler;
