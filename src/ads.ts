import { TaddyWeb } from './taddy';
import { Ad, InterstitialConfig } from './types';
import { showInterstitial } from './components/interstitial';

const defaultInterstitialConfig: Partial<InterstitialConfig> = {};

export class Ads {
  private taddy: TaddyWeb;
  private ad: Ad | null = null;

  constructor(taddy: TaddyWeb) {
    this.taddy = taddy;
  }

  public preload = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (this.ad) return resolve(true);
      this.taddy
        .call<Ad | null>('/ads/get')
        .then((ad) => {
          if (ad) {
            this.ad = ad;
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(reject);
    });
  };

  public interstitial = (config: InterstitialConfig) => {
    config = { ...config, ...defaultInterstitialConfig };
    this.preload().then((ready) => {
      if (!ready) return;
      showInterstitial(this.ad!, config)
        .finally(() => (this.ad = null))
        .finally(this.preload);
      setTimeout(() => this.sendImpression(this.ad!), 1000);
    });
  };

  public sendImpression = (ad: Ad) => {
    this.taddy.call('/ads/impressions', { id: ad.id }).then();
  };
}
