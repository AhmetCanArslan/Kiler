// Utility to handle copying a file from a content:// URI to app's cache directory using expo-file-system
import * as FileSystem from 'expo-file-system';
import mime from 'mime/lite';
import { Platform } from 'react-native';

export async function copyContentUriToCache(contentUri: string): Promise<string> {
  try {
    // Generate a unique filename
    const extension = mime.getExtension ? mime.getExtension('image/jpeg') : 'jpg';
    const fileName = `shared_${Date.now()}.${extension}`;
    const destPath = `${FileSystem.cacheDirectory}${fileName}`;

    if (Platform.OS === 'android' && contentUri.startsWith('content://')) {
      // Use FileSystem to copy the file
      const result = await FileSystem.getContentUriAsync(contentUri);
      if (!result) throw new Error('Failed to get content URI');
      await FileSystem.copyAsync({ from: result, to: destPath });
      return destPath;
    } else if (contentUri.startsWith('file://')) {
      await FileSystem.copyAsync({ from: contentUri, to: destPath });
      return destPath;
    } else {
      throw new Error('Unsupported URI scheme');
    }
  } catch (error) {
    console.error('[copyContentUriToCache] Error:', error);
    throw error;
  }
}

// Prevent Expo Router warning by exporting an empty component as default
export default function FileUtilsPlaceholder() { return null; }
