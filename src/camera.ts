const JPEG_PREFIX = 'data:image/jpeg;base64,';

export function jpegBlobFromDataUrl(dataUrl: string): { data: string; mimeType: 'image/jpeg' } | null {
  if (!dataUrl.startsWith(JPEG_PREFIX)) return null;
  const data = dataUrl.slice(JPEG_PREFIX.length);
  if (!data) return null;
  return { data, mimeType: 'image/jpeg' };
}

export function captureVideoJpeg(video: HTMLVideoElement, maxWidth = 320): { data: string; mimeType: 'image/jpeg' } | null {
  if (video.readyState < 2 || video.videoWidth < 2) return null;
  const canvas = document.createElement('canvas');
  const width = Math.min(maxWidth, video.videoWidth);
  const height = Math.max(1, Math.round((video.videoHeight / video.videoWidth) * width));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return jpegBlobFromDataUrl(canvas.toDataURL('image/jpeg', 0.6));
}

export async function getInterviewMedia(): Promise<{ stream: MediaStream; hasVideo: boolean }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    return { stream, hasVideo: stream.getVideoTracks().length > 0 };
  } catch {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return { stream, hasVideo: false };
  }
}
