import { describe, expect, it } from 'vitest';
import { jpegBlobFromDataUrl } from '../src/camera';

describe('jpegBlobFromDataUrl', () => {
  it('extracts base64 jpeg payload', () => {
    const blob = jpegBlobFromDataUrl('data:image/jpeg;base64,abc123');
    expect(blob).toEqual({ data: 'abc123', mimeType: 'image/jpeg' });
  });

  it('rejects non-jpeg data urls', () => {
    expect(jpegBlobFromDataUrl('data:image/png;base64,abc123')).toBeNull();
    expect(jpegBlobFromDataUrl('data:image/jpeg;base64,')).toBeNull();
  });
});
