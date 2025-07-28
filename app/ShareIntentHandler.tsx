import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useSharedDataStore } from '../store/useSharedDataStore';

// Helper to trigger modals/input dialogs in tabs
export const handleShareIntent = (sharedData: any, router: any, setSharedData: (data: any) => void) => {
  if (!sharedData) return;

  // 1. Set the data in the global store FIRST
  setSharedData(sharedData);

  // 2. THEN, navigate to the correct screen
  try {
    if (sharedData.type === 'photo') {
      // The logic for copying content URI can stay the same
      // ...
      router.push('/(tabs)/photos');
    } else if (sharedData.type === 'link') {
      router.push('/(tabs)/links');
    } else if (sharedData.type === 'text') {
      router.push('/(tabs)/notes');
    }
  } catch (error) {
    console.error('[handleShareIntent] Error processing shared data:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
};


// Listen for share intents
const ShareIntentHandler: React.FC = () => {
  const router = useRouter();
  const { setSharedData } = useSharedDataStore();

  useEffect(() => {
    console.log('[ShareIntentHandler] Mounted');
    // ... (interface definitions remain the same)

    ReceiveSharingIntent.getReceivedFiles(
      async (files: any[]) => {
        try {
          console.log('[ShareIntentHandler] Received files:', JSON.stringify(files));
          if (files && files.length > 0) {
            const file: any = files[0];
            console.log('[ShareIntentHandler] Processing file:', JSON.stringify(file));
            if (
              (file.fileType && file.fileType.startsWith('image/')) ||
              (file.mimeType && file.mimeType.startsWith('image/'))
            ) {
              console.log('[ShareIntentHandler] Detected image');
              const imageUri = file.filePath || file.contentUri;
              await handleShareIntent({ type: 'photo', data: imageUri, skipCopy: !!file.filePath }, router, setSharedData);
            } else if (file.text && file.text.startsWith('http')) {
              console.log('[ShareIntentHandler] Detected link');
              await handleShareIntent({ type: 'link', data: file.text }, router, setSharedData);
            } else if (file.text) {
              console.log('[ShareIntentHandler] Detected text');
              await handleShareIntent({ type: 'text', data: file.text }, router, setSharedData);
            } else {
              console.log('[ShareIntentHandler] Unknown file type');
            }
          } else {
            console.log('[ShareIntentHandler] No files received');
          }
        } catch (error) {
          console.error('[ShareIntentHandler] Error in getReceivedFiles callback:', error);
          if (error instanceof Error) {
            console.error(error.stack);
          }
        }
      },
      (error: any) => {
        // ... (error handling remains the same)
      },
      'KilerShareIntent'
    );
    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, [router, setSharedData]);
  return null;
};

export default ShareIntentHandler;