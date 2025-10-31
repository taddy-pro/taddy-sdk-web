import { Taddy, TaddyWeb } from './taddy';

export * from './taddy';
export * from './ads';
export * from './exchange';
export * from './types';

declare global {
  interface Window {
    Taddy: typeof Taddy;
    /**
     * @deprecated
     */
    TaddyWeb: typeof TaddyWeb;
  }
}

const data = document.currentScript?.dataset;
if (data?.pubId) {
  const disableProviders: string[] = data.disableProviders?.split(',') ?? [];
  void Taddy.init(data.pubId, {
    debug: data.debug === 'true',
    disableExternalProviders: disableProviders.includes('external'),
    disablePlaymaticProvider: disableProviders.includes('playmatic'),
    disableTeleAdsProvider: disableProviders.includes('teleads'),
    disableMonetagProvider: disableProviders.includes('monetag'),
    disableNygmaProvider: disableProviders.includes('nygma'),
  });
  void Taddy.ready();
}
