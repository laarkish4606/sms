import { store } from '../app/store.js';

// Authenticated file download: fetchBaseQuery/axios both struggle with
// "open this PDF in a new tab" semantics, so we fetch as a blob and
// trigger a synthetic <a download> instead.
export async function downloadAuthenticatedFile(url, filename) {
  const token = store.getState().auth.accessToken;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Download failed');

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default downloadAuthenticatedFile;
