export const ACCEPTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.json',
] as const;

export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
] as const;

export const ACCEPTED_FILE_TYPES = ACCEPTED_FILE_EXTENSIONS.join(',');

export function isAcceptedUploadFile(file: File) {
  const extension = getFileExtension(file.name);
  return (
    ACCEPTED_MIME_TYPES.includes(file.type as typeof ACCEPTED_MIME_TYPES[number]) ||
    ACCEPTED_FILE_EXTENSIONS.includes(extension as typeof ACCEPTED_FILE_EXTENSIONS[number])
  );
}

export function getAcceptedClipboardFiles(clipboardData: DataTransfer) {
  const files = clipboardData.files.length > 0
    ? Array.from(clipboardData.files)
    : Array.from(clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

  return files.filter((file) => file.size > 0 && isAcceptedUploadFile(file));
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}
