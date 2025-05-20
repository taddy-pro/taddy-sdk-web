import { TaddyWeb } from './taddy';
import { Ad, EFormat, InterstitialConfig } from './types';
import { showInterstitial } from './components/interstitial';
import { loadResource } from './utils';

const defaultInterstitialConfig: Partial<InterstitialConfig> = {};

export class Ads {
  private taddy: TaddyWeb;
  private ads: Partial<Record<EFormat, Ad>> = {};

  constructor(taddy: TaddyWeb) {
    this.taddy = taddy;
  }

  public preload = (format: EFormat | string): Promise<boolean> => {
    if (format === 'interstitial') format = EFormat.Interstitial;
    return new Promise((resolve, reject) => {
      if (this.ads[format as EFormat]) return resolve(true);
      this.taddy
        .call<Ad | null>('/ads/get', { format })
        .then((ad) => {
          if (ad) {
            this.ads[format as EFormat] = ad;
            const preload = [];
            if (ad.icon) preload.push(loadResource(ad.icon));
            if (ad.image) preload.push(loadResource(ad.image));
            if (ad.video) preload.push(loadResource(ad.video));
            Promise.all(preload).then(() => resolve(true));
          } else {
            resolve(false);
          }
        })
        .catch(reject);
    });
  };

  public interstitial = (config?: InterstitialConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      this.preload(EFormat.Interstitial)
        .then((ready) => {
          if (!ready) return resolve(false);
          showInterstitial(
            this.ads[EFormat.Interstitial]!,
            { ...config, ...defaultInterstitialConfig },
            this.taddy,
          ).finally(() => {
            delete this.ads[EFormat.Interstitial];
            resolve(true);
          });
          setTimeout(() => this.sendImpression(this.ads[EFormat.Interstitial]!), 1000);
        })
        .catch(() => resolve(false));
    });
  };

  public checkViewThrough = (id: string) => this.taddy.call<boolean>('/ads/view-through/check', { id });

  public sendImpression = (ad: Ad) => {
    this.taddy.call('/ads/impressions', { id: ad.id }).then();
  };
}
