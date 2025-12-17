export function normalizeUrl(inputUrl) {
  if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
    return inputUrl;
  }
  return `https://${inputUrl}`;
}

export function displayUrl(inputUrl) {
  let url = inputUrl;
  if (url.startsWith('https://')) {
    url = url.slice(8);
  } else if (url.startsWith('http://')) {
    url = url.slice(7);
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

export function getDomain(urlString) {
  try {
    const normalized = normalizeUrl(urlString);
    const url = new URL(normalized);
    return url.hostname;
  } catch {
    return urlString;
  }
}
