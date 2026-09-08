import DOMPurify from 'isomorphic-dompurify';

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

export function sanitizeTextInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const validMime = allowedTypes.includes(file.type);
  const validExtension = allowedTypes.some(type => {
    const ext = type.split('/')[1];
    return file.name.toLowerCase().endsWith(`.${ext}`) ||
           (ext === 'jpeg' && file.name.toLowerCase().endsWith('.jpg'));
  });
  return validMime && validExtension;
}
