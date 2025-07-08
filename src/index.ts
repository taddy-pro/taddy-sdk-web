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
