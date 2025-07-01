import { TaddyWeb } from './taddy';
import { CustomEvent, ExchangeFeedOptions, FeedItem } from './types';

export class Exchange {
  private taddy: TaddyWeb;

  constructor(taddy: TaddyWeb) {
    this.taddy = taddy;
  }

  /**
   * @deprecated
   */
  customEvent(event: CustomEvent, options?: { value?: number | null; currency?: string; once?: boolean }) {
    console.warn('Deprecated taddy.exchange().customEvent call. Please use taddy.customEvent directly');
    void this.taddy.customEvent(event, options);
  }

  feed = (options?: ExchangeFeedOptions) => {
    if (!this.taddy.isReady) throw new Error('Taddy: ready() not called');
    return this.taddy.call<FeedItem[]>('/exchange/feed', options);
  };

  impressions = (tasks: FeedItem[]) => {
    return this.taddy.call('/exchange/impressions', { ids: tasks.map((t) => t.id) });
  };

  check(task: FeedItem): Promise<boolean> {
    return this.taddy.call<boolean>('/exchange/check', { taskId: task.id });
  }

  open(task: FeedItem, autoCheck: boolean = true): Promise<boolean | null> {
    return new Promise((resolve, reject) => {
      this.taddy
        .request<string>('POST', task.link)
        .then((link) => {
          if (link.startsWith('https://t.me')) {
            window.Telegram.WebApp.openTelegramLink(link);
          } else {
            window.Telegram.WebApp.openLink(link, {
              // @ts-ignore
              try_browser: 'chrome',
              try_instant_view: false,
            });
          }
          if (autoCheck) {
            let counter = 0;
            const check = () => {
              this.check(task).then((completed) => {
                if (completed) resolve(true);
                else if (++counter < 100) setTimeout(check, 1000);
                else reject('Check timed out');
              });
            };
            setTimeout(check, 1000);
          } else {
            resolve(null);
          }
        })
        .catch(reject);
    });
  }
}
