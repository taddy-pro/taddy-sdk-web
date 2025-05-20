export const loadJs = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const loadCss = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = src;
    link.media = 'all';
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
};

export const loadResource = (url: string) =>
  fetch(url, {
    cache: 'force-cache',
    mode: 'no-cors',
  });
