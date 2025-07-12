import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

// Helper to trigger modals/input dialogs in tabs
export const handleShareIntent = async (sharedData: any, router: any) => {
  if (!sharedData) return;

  if (sharedData.type === 'photo') {
    // Route to photos tab and pass photo URI, trigger modal
    router.push({ pathname: '/(tabs)/photos', params: { shareUri: sharedData.data, showPhotoModal: true } });
  } else if (sharedData.type === 'link') {
    // Route to links tab and pass link URL, trigger modal
    router.push({ pathname: '/(tabs)/links', params: { shareUrl: sharedData.data, showLinkModal: true } });
  } else if (sharedData.type === 'text') {
    // Route to notes tab and pass note content, trigger modal
    router.push({ pathname: '/(tabs)/notes', params: { shareText: sharedData.data, showNoteModal: true } });
  }
};

// Listen for share intents
const ShareIntentHandler: React.FC = () => {
  const router = useRouter();
  useEffect(() => {
    interface ReceivedFile {
      fileType?: string;
      weblink?: string;
      filePath?: string;
      text?: string;
    }

    type GetReceivedFilesSuccessCallback = (files: ReceivedFile[]) => void;
    type GetReceivedFilesErrorCallback = (error: any) => void;

    ReceiveSharingIntent.getReceivedFiles(
      (files: ReceivedFile[]) => {
        if (files && files.length > 0) {
          const file: ReceivedFile = files[0];
          if (file.fileType && file.fileType.startsWith('image/')) {
            handleShareIntent({ type: 'photo', data: file.weblink || file.filePath }, router);
          } else if (file.text && file.text.startsWith('http')) {
            handleShareIntent({ type: 'link', data: file.text }, router);
          } else if (file.text) {
            handleShareIntent({ type: 'text', data: file.text }, router);
          }
        }
      },
      (error: any) => {
        console.log('Share intent error:', error);
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
