import { CustomEvent, TaddyConfig, TelegramUser, THeaders, THttpMethod, TResponse } from './types';
import { Ads } from './ads';
import { Exchange } from './exchange';

export interface ResourceInitData {
  id: number;
  username: string;
  apps: string[];
  externalAds: boolean;
  teleAdsToken: string;
  teleAdsUnitId: number;
}

const defaultConfig: Partial<TaddyConfig> = {
  debug: false,
  apiUrl: 'https://t.tadly.pro/v1',
};

declare global {
  interface Window {
    Telegram: Telegram;
  }
}

export class TaddyWeb {
  public pubId: string;
  public config: TaddyConfig;
  public isReady: boolean = false;

  private webApp: WebApp;
  private initData: WebApp['initDataUnsafe'];
  private readonly user: WebApp['initDataUnsafe']['user'];
  private _ads?: Ads;
  private _exchange?: Exchange;
  private _user: Partial<TelegramUser> = {};
  private _resourceInitData?: ResourceInitData;

  constructor(pubId: string, config?: TaddyConfig) {
    if (!window.Telegram || !window.Telegram.WebApp) throw new Error('[Taddy] Telegram WebApp script is not loaded');
    this.pubId = pubId;
    this.config = { ...defaultConfig, ...config };
    this.webApp = window.Telegram.WebApp;
    this.initData = this.webApp.initDataUnsafe;
    this.user = this.initData.user;
    void this.getResourceInitData();
    // document.addEventListener('DOMContentLoaded', () => this.logEvent('dom-ready'), { once: true });
  }

  public getResourceInitData = (): Promise<ResourceInitData> => {
    return new Promise((resolve) => {
      if (this._resourceInitData) return resolve(this._resourceInitData);
      this.call<ResourceInitData>('/resources/init').then((data) => {
        this._resourceInitData = data;
        resolve(data);
      });
    });
  };

  private getUser = (): TelegramUser => {
    return {
      ...this._user,
      id: this.user?.id!,
      username: this.user?.username,
      firstName: this.user?.first_name,
      lastName: this.user?.last_name,
      language: this.user?.language_code,
      premium: this.user?.is_premium,
      source: this.initData.start_param || null,
    };
  };

  public ready = (user?: Partial<TelegramUser>): void => {
    this._user = { ...this._user, ...user };
    if (!this.isReady) {
      this.call('/events/start', { start: this.initData.start_param, url: window.location.href }).then();
      this.isReady = true;
      return;
    }
    console.warn('[Taddy] ready() already called');
  };

  public customEvent = async (
    event: CustomEvent,
    options?: { value?: number | null; currency?: string; once?: boolean; payload?: Record<string, any> },
  ) => {
    this.debug(`Sending "${event}" event`, options);
    try {
      return await this.call<void>('/events/custom', {
        event,
        payload: options?.payload,
        value: options?.value,
        currency: options?.currency,
        once: options?.once,
      });
    } catch (e) {
      console.warn('[Taddy]', e);
    }
  };

  public ads(): Ads {
    return this._ads ?? (this._ads = new Ads(this));
  }

  public exchange(): Exchange {
    return this._exchange ?? (this._exchange = new Exchange(this));
  }

  public call = <T>(endpoint: string, payload: object = {}) => {
    const url = `${this.config.apiUrl}${endpoint}`;
    return this.request('POST', url, {
      pubId: this.pubId,
      user: this.getUser(),
      origin: 'web',
      ...payload,
    }) as Promise<T>;
  };

  public request = <T>(
    method: THttpMethod,
    url: string,
    payload: object | FormData = {},
    fields: string[] = [],
  ): Promise<T> => {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      const processReject = (error: string, code: number) => {
        console.error('[Taddy]', error, code);
        reject(error);
      };

      const options: { method: string; headers: THeaders; body?: FormData | string } = {
        method: method.toUpperCase(),
        headers: {
          accept: 'application/json',
        },
      };

      if (payload instanceof FormData) {
        payload.append('fields', fields.join(','));
        options.body = payload;
      } else {
        options.headers['content-type'] = 'application/json';
        // @ts-ignore
        payload['fields'] = fields;
        if (payload && method !== 'GET') options.body = JSON.stringify(payload);
      }

      if (payload && method === 'GET') {
        const json = JSON.stringify(payload);
        if (json !== '{}') url += '?__payload=' + encodeURIComponent(json);
      }

      this.debug('Request', method, url.split('?')[0], JSON.parse(JSON.stringify(payload)));

      fetch(url, options)
        .then((response) => {
          if (response.status === 204) resolve(null!);
          else
            response
              .json()
              .then((data: TResponse) => {
                if (data.error) processReject(data.error, response.status);
                else {
                  this.debug('Result', data.result);
                  resolve(data.result);
                }
              })
              .catch((e) => processReject(e, -2));
        })
        .catch((e) => processReject(e, -1));
    });
  };

  public debug = (...v: any) => {
    if (this.config.debug) {
      console.log('[Taddy]', ...v);
    }
  };
}

export const Taddy = (pubId: string, config?: TaddyConfig) => new TaddyWeb(pubId, config);
