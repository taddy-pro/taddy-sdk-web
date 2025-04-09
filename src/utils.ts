export const preloadResource = (url: string) =>
  fetch(url, {
    cache: 'force-cache',
    mode: 'no-cors',
  });
