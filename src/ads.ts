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
          // if (!ready) return this.showExternalAd();
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
  //
  // private showExternalAd = async (): Promise<boolean> => {
  //   try {
  //     const initData = await this.taddy.getResourceInitData();
  //     if (!initData.externalAds) return Promise.resolve(false);
  //     const providers = [this.playmaticProvider];
  //     for (const provider of providers) {
  //       try {
  //         if (await provider(initData)) return Promise.resolve(true);
  //       } catch (e) {
  //         console.warn('Taddy:', e);
  //       }
  //     }
  //   } catch (e) {
  //     console.error(e);
  //   }
  //   this.taddy.debug('Nothing to show');
  //   return Promise.resolve(false);
  // };
  //
  // private playmaticProvider = async (initData: ResourceInitData): Promise<boolean> => {
  //   this.taddy.debug('Trying Playmatic');
  //   // 'https://vast.ufouxbwn.com/vast.php?partner_id=7371124&format=4&set=9736922&referrer=taddy.pro',
  //   // `https://vast.ufouxbwn.com/vast.php?partner_id=7371124&format=2&referrer=${initData.apps[0] ?? 'app'}.${initData.username}`,
  //   return window
  //     .fetch(
  //       `https://vast2.ufouxbwn.com/vast.php?format=4&partner_id=6&ad_id=7526777&jsv=20250623&source=${initData.apps[0] ?? 'app'}.${initData.username}`,
  //     )
  //     .then((res) => res.text())
  //     .then(async (xml) => {
  //       if (xml.length <= 27) return false;
  //       // @ts-ignore
  //       window.pmCallBack = (act: string, data: any) => {
  //         console.log(act, data);
  //         if (act === 'stop mfs') {
  //           // Показ фулскрина окончен
  //           console.log('SHOW END');
  //         }
  //       };
  //
  //       await loadJs('https://demo.playmatic.video/dist/union/dev/pm.tg.vpaid.js');
  //
  //       xml = xml.replace(
  //         '</Impression>',
  //         `</Impression><Impression id="taddy"><![CDATA[${this.taddy.config.apiUrl}/vast/impression/${this.taddy.pubId}]]></Impression>`,
  //       );
  //
  //       console.log(xml);
  //       return true;
  //     });
  // };
}
