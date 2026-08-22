const IMGBB_API_KEY = '53fd5437be8d00a3efc5f0c834c194e0';

export interface UploadStatus {
  step: 'initializing' | 'uploading' | 'complete' | 'error';
  message: string;
}

export async function uploadToImgBB(
  base64Image: string,
  onStatusChange: (status: UploadStatus) => void
): Promise<string> {
  try {
    onStatusChange({ step: 'initializing', message: 'Preparing image upload...' });

    const base64Data = base64Image.split(',')[1];
    const formData = new FormData();
    formData.append('image', base64Data);

    onStatusChange({ step: 'uploading', message: 'Uploading image to ImgBB...' });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error?.message || 'ImgBB upload failed');
    }

    onStatusChange({ step: 'complete', message: 'Upload successful!' });
    return result.data.url;
  } catch (error: any) {
    onStatusChange({ step: 'error', message: error.message || 'Cloud sync failed' });
    throw error;
  }
}
