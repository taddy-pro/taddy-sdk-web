import { TaddyWeb } from './taddy';
import { ExchangeFeedOptions, FeedItem, CustomEvent } from './types';

export class Exchange {
  private taddy: TaddyWeb;

  constructor(taddy: TaddyWeb) {
    this.taddy = taddy;
  }

  // private logEvent(event: TEvent, payload: Record<string, any> = {}) {
  //   payload = { ...payload, event, pubId: this.pubId };
  //   if (this.taddy.config.debug) console.info(`Taddy: Sending "${event}" event`, payload);
  //   this.taddy.call('/events', payload).catch((e) => this.taddy.config.debug && console.warn('Taddy:', e));
  // }
  //

  customEvent(event: CustomEvent, options?: { value?: number | null; currency?: string; once?: boolean }) {
    if (this.taddy.config.debug) console.info(`Taddy: Sending "${event}" event`, options);
    this.taddy
      .call('/events/custom', {
        event,
        value: options?.value,
        currency: options?.currency,
        once: options?.once,
      })
      .catch((e) => this.taddy.config.debug && console.warn('Taddy:', e));
  }

  feed = (options?: ExchangeFeedOptions) => {
    if (!this.taddy.isReady) throw new Error('Taddy: ready() not called');
    return this.taddy.call<FeedItem[]>('/exchange/feed', options);
  };

  impressions = (tasks: FeedItem[]) => {
    return this.taddy.call('/exchange/impressions', { ids: tasks.map((t) => t.id) });
  };

  open(task: FeedItem): Promise<void> {
    return new Promise((resolve, reject) => {
      this.taddy
        .request<string>('POST', task.link)
        .then((link) => {
          window.Telegram.WebApp.openTelegramLink(link);
          let counter = 0;
          const check = () => {
            this.taddy.call<boolean>('/exchange/check', { taskId: task.id }).then((completed) => {
              if (completed) resolve();
              else if (++counter < 100) setTimeout(check, 1000);
              else reject('Check timed out');
            });
          };
          setTimeout(check, 1000);
        })
        .catch(reject);
    });
  }
}
