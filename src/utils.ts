export const loadJs = (src: string, data?: Record<string, string>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.async = true;
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        const attrName = key.startsWith('data-') ? key : `data-${key}`;
        script.setAttribute(attrName, value);
      });
    }
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
