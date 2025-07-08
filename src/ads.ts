import { ResourceInitData, TaddyWeb } from './taddy';
import { Ad, EFormat, InterstitialConfig } from './types';
import { showInterstitial } from './components/interstitial';
import { loadJs, loadResource } from './utils';

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
        .then((loaded) => {
          // return this.showExternalAd();
          if (!loaded) return this.showExternalAd();
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

  public sendClick = (ad: Ad) => {
    this.taddy.call('/ads/click', { id: ad.id }).then();
  };

  private showExternalAd = async (): Promise<boolean> => {
    try {
      const initData = await this.taddy.getResourceInitData();
      if (!initData.externalAds) return Promise.resolve(false);
      // const providers = [this.teleadsProvider, this.playmaticProvider];
      const providers = [this.playmaticProvider];
      for (const provider of providers) {
        try {
          if (await provider(initData)) return Promise.resolve(true);
        } catch (e) {
          console.warn('[Taddy]', e);
        }
      }
    } catch (e) {
      console.error('[Taddy]', e);
    }
    this.taddy.debug('Nothing to show');
    return Promise.resolve(false);
  };
  //
  // private teleadsProvider = async (initData: ResourceInitData): Promise<boolean> => {
  //   this.taddy.debug('TeleAds');
  //   return new Promise(async (resolve) => {
  //     try {
  //       if (!initData.teleAdsUnitId || !initData.teleAdsToken) return resolve(false);
  //       await loadJs('https://assets.teleads.pro/sdk/index.umd.js?v2');
  //       // @ts-ignore
  //       window.TeleAdsTMA.init(initData.teleAdsToken);
  //       let adLoaded = false;
  //       // @ts-ignore
  //       await window.TeleAdsTMA.showAd({
  //         adUnitId: initData.teleAdsUnitId.toString(),
  //         onAdLoaded: () => (adLoaded = true),
  //       });
  //       resolve(adLoaded);
  //     } catch (error) {
  //       console.error('[TeleAds]', error);
  //       resolve(false);
  //     }
  //   });
  // };

  private playmaticProvider = async (initData: ResourceInitData): Promise<boolean> => {
    this.taddy.debug('[Playmatic]');
    return window
      .fetch(
        `https://vast.ufouxbwn.com/vast.php?partner_id=7371124&format=4&set=6225881&referrer=${initData.apps[0] ?? 'app'}.${initData.username}`,
      )
      .then((res) => res.text())
      .then(
        (xml) =>
          new Promise(async (resolve, reject) => {
            if (xml.length <= 27) {
              this.taddy.debug('[Playmatic]', 'Empty VAST');
              return resolve(false);
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'text/xml');
            const pricing = doc.getElementsByTagName('Pricing')[0];
            if (!pricing) {
              this.taddy.debug('[Playmatic]', 'Empty pricing');
              return resolve(false);
            }
            const model = pricing.getAttribute('model')?.toLowerCase(); // "CPM"
            const currency = pricing.getAttribute('currency'); // "USD"
            const cost = Number(pricing.textContent); // || 1.23; // "123.45"
            if (cost <= 0) {
              this.taddy.debug('[Playmatic]', 'Empty cost');
              return resolve(false);
            }
            const creative = doc.getElementsByTagName('Creative')[0];
            if (!creative) {
              this.taddy.debug('[Playmatic]', 'Empty creative');
              return resolve(false);
            }
            const ad = Number(creative.getAttribute('id'));
            const tag = await this.taddy.call<string>('/playmatic/tag', {
              model,
              currency,
              cost,
              ad,
            });
            // @ts-ignore
            window.pmCallBack = (act: string, data: any) => {
              // this.taddy.debug('[Playmatic pmCallBack]', act, data);
              if (act === 'show mfs') {
                this.taddy.debug('[Playmatic]', 'IMPRESSION');
                this.sendImpression({ id: tag } as Ad);
              }
              if (act === 'click mfs') {
                this.taddy.debug('[Playmatic]', 'CLICK');
                this.sendClick({ id: tag } as Ad);
              }
              if (act === 'stop mfs') {
                this.taddy.debug('[Playmatic]', 'AD CLOSED');
                return resolve(true);
              }
            };
            await loadJs('https://cdnwidget.simplejsmenu.com/dist/union/dev/pm.tg.vpaid.js');
            // @ts-ignore
            window.PMTGVPAID.Mfs.start(xml);
          }),
      );
  };
}
