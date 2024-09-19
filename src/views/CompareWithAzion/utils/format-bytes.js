export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const kilobyte = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(kilobyte));

  return String(parseFloat((bytes / Math.pow(kilobyte, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex]);
};