import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useSharedDataStore } from '../store/useSharedDataStore';

// Helper to trigger modals/input dialogs in tabs
export const handleShareIntent = (sharedData: any, router: any, setSharedData: (data: any) => void) => {
  if (!sharedData) return;

  // 1. Set the data in the global store FIRST
  setSharedData(sharedData);

  // 2. THEN, navigate to the correct screen with params
  try {
    if (sharedData.type === 'photo') {
      // ...existing code...
      router.push({ pathname: '/(tabs)/photos', params: { shareUri: sharedData.data } });
    } else if (sharedData.type === 'link') {
      router.push({ pathname: '/(tabs)/links', params: { sharedLink: sharedData.data } });
    } else if (sharedData.type === 'text') {
      // Pass the shared text as param so notes screen can autofill and open modal
      router.push({ pathname: '/(tabs)/notes', params: { sharedText: sharedData.data } });
    }
  } catch (error) {
    console.error('[handleShareIntent] Error processing shared data:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
};


const ShareIntentHandler: React.FC = () => {
  const router = useRouter();
  const { setSharedData } = useSharedDataStore();

  useEffect(() => {
    console.log('[ShareIntentHandler] Component mounted and listening for shares.');

    ReceiveSharingIntent.getReceivedFiles(
      async (files: any[]) => {
        // LOG 1: Paylaşım olayı tetiklendi mi?
        console.log('LOG 1: [ShareIntentHandler] getReceivedFiles callback fired!');
        
        // LOG 2: İşletim sisteminden gelen veri tam olarak ne?
        console.log('LOG 2: [ShareIntentHandler] Received files object:', JSON.stringify(files, null, 2));

        try {
          if (files && files.length > 0) {
            const file: any = files[0];
            
            if ((file.fileType && file.fileType.startsWith('image/')) || (file.mimeType && file.mimeType.startsWith('image/'))) {
              // ... (image logic)
            } else if (file.text && file.text.startsWith('http')) {
              // ... (link logic)
            } else if (file.text) {
              console.log('LOG 3: [ShareIntentHandler] Detected TEXT. Preparing to handle...');
              const dataToShare = { type: 'text', data: file.text };
        if (!files) {
          console.error('[ShareIntentHandler] Received null files from intent!');
          return;
        }

              
              // LOG 4: Mağazaya ve router'a göndermeden hemen önce
              console.log('LOG 4: [ShareIntentHandler] Calling handleShareIntent with:', dataToShare);
            if (!file) {
              console.error('[ShareIntentHandler] First file object is null:', files);
              return;
            }
              await handleShareIntent(dataToShare, router, setSharedData);
            } else {
              console.log('[ShareIntentHandler] Unknown file type received.');
            }
          }
        } catch (err) {
          console.error('[ShareIntentHandler] Error in getReceivedFiles callback:', err);
          if (err instanceof Error) {
            console.error('[ShareIntentHandler] Error stack:', err.stack);
          }
        }
      },
      (err: any) => {
        // Ignore null intent errors (expected when app is opened normally)
        if (err && typeof err === 'object' && err.message && err.message.includes('getAction()')) {
          // This is the expected null intent error, ignore it
          return;
        }
        console.error('[ShareIntentHandler] Share intent error callback:', err);
        if (err instanceof Error) {
          console.error('[ShareIntentHandler] Error stack:', err.stack);
        }
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