/**
 * Utility to trigger browser file download from Blob response
 */
export function downloadBlob(blobData, fileName, mimeType) {
  const blob = new Blob([blobData], { type: mimeType });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
