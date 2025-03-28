import { TaddyConfig, TelegramUserDto, THeaders, THttpMethod, TResponse } from './types';
import { Ads } from './ads';

const defaultConfig: Partial<TaddyConfig> = {
  debug: false,
  apiUrl: 'https://t.tadly.pro/v1',
};

export class Taddy {
  private readonly pubId: string;
  private readonly config: TaddyConfig;
  private webApp: WebApp;
  private initData: WebApp['initDataUnsafe'];
  private readonly user: WebApp['initDataUnsafe']['user'];
  private isReady: boolean = false;

  private _ads?: Ads;

  constructor(pubId: string, config?: TaddyConfig) {
    if (!window.Telegram || !window.Telegram.WebApp) throw new Error('Taddy: Telegram WebApp script is not loaded');
    this.pubId = pubId;
    this.config = { ...defaultConfig, ...config };
    this.webApp = window.Telegram.WebApp;
    this.initData = this.webApp.initDataUnsafe;
    this.user = this.initData.user;
    // document.addEventListener('DOMContentLoaded', () => this.logEvent('dom-ready'), { once: true });
  }

  private getUserDto(): TelegramUserDto {
    return {
      id: this.user?.id!,
      username: this.user?.username,
      firstName: this.user?.first_name,
      lastName: this.user?.last_name,
      language: this.user?.language_code,
      premium: this.user?.is_premium,
      source: this.initData.start_param || null,
    };
  }

  ready(): void {
    if (!this.isReady) {
      this.call('/events/start', { start: this.initData.start_param }).then();
      this.isReady = true;
      return;
    }
    console.warn('Taddy: ready() already called');
  }

  public ads(): Ads {
    return this._ads ?? (this._ads = new Ads(this));
  }

  //
  // private logEvent(event: TEvent, payload: Record<string, any> = {}) {
  //   payload = { ...payload, event, pubId: this.pubId };
  //   if (this.config.debug) console.info(`Taddy: Sending "${event}" event`, payload);
  //   this.request('POST', '/events', payload).catch((e) => this.config.debug && console.warn('Taddy:', e));
  // }
  //
  // customEvent(event: TCustomEvent, options?: { value?: number | null; currency?: string; once?: boolean }) {
  //   if (this.config.debug) console.info(`Taddy: Sending "${event}" event`, options);
  //   this.request('POST', '/events/custom', {
  //     pubId: this.pubId,
  //     user: this.user!.id,
  //     event,
  //     value: options?.value,
  //     currency: options?.currency,
  //     once: options?.once,
  //   }).catch((e) => this.config.debug && console.warn('Taddy:', e));
  // }
  //
  // ready(): void {
  //   if (!this.isReady) {
  //     this.logEvent('ready', { user: this.user, start: this.initData.start_param });
  //     this.isReady = true;
  //     return;
  //   }
  //   console.warn('Taddy: ready() already called');
  // }
  //
  // tasks = (options?: IGetTasksOptions) => {
  //   if (!this.isReady) throw new Error('Taddy: ready() not called');
  //   return this.request<ITask[]>('POST', '/exchange/feed', {
  //     pubId: this.pubId,
  //     user: this.user,
  //     start: this.initData.start_param,
  //     origin: 'web',
  //     ...options,
  //   });
  // };
  //
  // impressions(tasks: ITask[]): void {
  //   this.logEvent('impressions', { ids: tasks.map((t) => t.id), user: this.user });
  // }
  //
  // open(task: ITask): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     this.request<string>('POST', task.link)
  //       .then((link) => {
  //         window.Telegram.WebApp.openTelegramLink(link);
  //         let counter = 0;
  //         const check = () => {
  //           this.request<boolean>('POST', '/exchange/check', { exchangeId: task.id, userId: this.user!.id }).then(
  //             (completed) => {
  //               if (completed) resolve();
  //               else if (++counter < 100) setTimeout(check, 1000);
  //               else reject('Check timed out');
  //             },
  //           );
  //         };
  //         setTimeout(check, 1000);
  //       })
  //       .catch(reject);
  //   });
  // }

  public call = <T>(endpoint: string, payload: object = {}) => {
    return this.request('POST', endpoint, {
      pubId: this.pubId,
      user: this.getUserDto(),
      origin: 'web',
      ...payload,
    }) as Promise<T>;
  };

  private request = <T>(
    method: THttpMethod,
    endpoint: string,
    payload: object | FormData = {},
    fields: string[] = [],
  ): Promise<T> => {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      const processReject = (error: string, code: number) => {
        if (this.config.debug) console.error('Taddy: Error', code, error);
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
        if (json !== '{}') endpoint += '?__payload=' + encodeURIComponent(json);
      }

      if (this.config.debug)
        console.log('Taddy: Request', method, endpoint.split('?')[0], JSON.parse(JSON.stringify(payload)));

      const url = `${this.config.apiUrl}${endpoint}`;

      fetch(url, options)
        .then((response) => {
          if (response.status === 204) resolve(null!);
          else
            response
              .json()
              .then((data: TResponse) => {
                if (data.error) processReject(data.error, response.status);
                else {
                  if (this.config.debug) console.info('Taddy: Result', data.result);
                  resolve(data.result);
                }
              })
              .catch((e) => processReject(e, -2));
        })
        .catch((e) => processReject(e, -1));
    });
  };
}
