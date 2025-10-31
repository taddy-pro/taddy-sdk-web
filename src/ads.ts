import { Network, ResourceInitData, TaddyWeb } from './taddy';
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

  public checkViewThrough = (id: string) => this.taddy.call<boolean>('/ads/view-through/check', { id });

  public sendImpression = (ad: Ad) => {
    this.taddy.call('/ads/impressions', { id: ad.id }).then();
  };

  public sendClick = (ad: Ad) => {
    this.taddy.call('/ads/click', { id: ad.id }).then();
  };

  public interstitial = async (config?: InterstitialConfig): Promise<boolean> => {
    config = { ...config, ...defaultInterstitialConfig };
    const initData = await this.taddy.getResourceInitData();

    const viewThrough = (id: string) => {
      void this.taddy.call('/ads/view-through', { id, payload: config.payload });
      if (config.onViewThrough) config.onViewThrough(id);
    };

    const providers: Record<Network, typeof this.taddyProvider> = {
      [Network.Taddy]: this.taddyProvider,
      [Network.Playmatic]: this.playmaticProvider,
      [Network.TeleAds]: this.teleadsProvider,
      [Network.Monetag]: this.monetagProvider,
      [Network.Nygma]: this.nygmaProvider,
    };
    for (const network of initData.networks) {
      try {
        if (network !== Network.Taddy) {
          if (this.taddy.config.disableExternalProviders) {
            this.taddy.debug('Skipping external network:', network);
            return false;
          }
        }
        this.taddy.debug('Trying network:', network);
        if (await providers[network](initData, config, viewThrough)) {
          this.taddy.debug('<' + network + '> Success');
          return true;
        }
      } catch (e) {
        console.warn('[TaddySDK]', e);
      }
    }
    this.taddy.debug('Nothing to show');
    return false;
  };

  private monetagProvider = async (
    initData: ResourceInitData,
    config: InterstitialConfig,
    viewThrough: (id: string) => void,
  ): Promise<boolean> => {
    if (this.taddy.config.disableMonetagProvider || !initData.monetag) {
      this.taddy.debug('Skipping Monetag');
      return false;
    }
    if (!initData.monetagZone) {
      this.taddy.debug('<Monetag> not ready');
      return false;
    }
    try {
      // @ts-ignore
      if (typeof window.show_monetag === 'undefined') {
        this.taddy.debug('<Monetag> Attaching SDK...');
        await loadJs(`https://${initData.monetagDomain}/sdk.js?v2`, {
          zone: initData.monetagZone.toString(),
          sdk: 'show_monetag',
        });
      }
      const ymid = await this.taddy.call<string>('/monetag/tag');
      this.taddy.debug('<Monetag> Preloading...');
      // @ts-ignore
      await show_monetag({ type: 'preload', ymid, requestVar: initData.username });
      this.taddy.debug('<Monetag> Showtime...');
      // @ts-ignore
      await show_monetag({ ymid, requestVar: initData.username });
      viewThrough(ymid);
      if (config.onClosed) config.onClosed();
      return true;
    } catch (e) {
      console.warn('[TaddySDK] <Monetag>', e);
      return false;
    }
  };

  private nygmaProvider = async (
    initData: ResourceInitData,
    config: InterstitialConfig,
    viewThrough: (id: string) => void,
  ): Promise<boolean> => {
    if (this.taddy.config.disableNygmaProvider || !initData.nygmaBlockId) {
      this.taddy.debug('Skipping Nygma');
      return false;
    }
    try {
      // @ts-ignore
      if (typeof window.NigmaSDK === 'undefined') {
        this.taddy.debug('<Nygma> Attaching SDK...');
        await loadJs(`https://static.nigma.smbadmin.tech/sdk/index.min.js`);
      }
      // @ts-ignore
      const NygmaController = window.NigmaSDK.init({ blockId: initData.nygmaBlockId });
      this.taddy.debug('<Nygma> Showtime...');
      // @ts-ignore
      const res = await NygmaController.showAd();
      if (!res.cost) res.cost = 1.7;
      this.taddy.debug('<Nygma> Result', res);
      if (!res.error && res.cost) {
        const id = await this.taddy.call<string>('/nygma/tag', { cost: res.cost });
        void this.taddy.call('/ads/impressions', { id });
        viewThrough(id);
      }
      if (config.onClosed) config.onClosed();
      return true;
    } catch (e) {
      console.warn('[TaddySDK] <Nygma>', e);
      return false;
    }
  };

  private taddyProvider = async (
    _: ResourceInitData,
    config: InterstitialConfig,
    viewThrough: (id: string) => void,
  ): Promise<boolean> => {
    this.taddy.debug('<Taddy> getting ads...');
    const loaded = await this.preload(EFormat.Interstitial);
    if (!loaded) {
      this.taddy.debug('<Taddy> no ads');
      return false;
    }
    return await showInterstitial(
      this.ads[EFormat.Interstitial]!,
      config,
      () => {
        this.sendImpression(this.ads[EFormat.Interstitial]!);
      },
      viewThrough,
    ).finally(() => {
      delete this.ads[EFormat.Interstitial];
    });
  };

  private teleadsProvider = async (
    initData: ResourceInitData,
    config: InterstitialConfig,
    viewThrough: (id: string) => void,
  ): Promise<boolean> => {
    if (this.taddy.config.disableTeleAdsProvider || !initData.teleAds) {
      this.taddy.debug('Skipping TeleAds');
      return false;
    }
    this.taddy.debug('<TeleAds> Processing...');
    return new Promise(async (resolve) => {
      try {
        if (!initData.teleAdsUnitId || !initData.teleAdsToken) {
          this.taddy.debug('<TeleAds> not ready');
          return resolve(false);
        }
        const user = window.Telegram.WebApp.initDataUnsafe.user!;
        const response = await window.fetch('https://api.teleads.pro/api/publish/sync', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${initData.teleAdsToken}`,
          },
          body: JSON.stringify({
            unitId: initData.teleAdsUnitId,
            supid: user.id, // Math.round(Math.random() * user.id),
            userRawData: user,
            requirePrice: true,
          }),
        });
        const result = await response.json();
        if (!result.data) {
          this.taddy.debug('<TeleAds> No ads :(');
          return resolve(false);
        }
        const tag = await this.taddy.call<string>('/teleads/tag', { ad: result.data.id });
        // @ts-ignore
        if (typeof window.TeleAdsTMA === 'undefined') {
          this.taddy.debug('<TeleAds> Attaching SDK...');
          await loadJs('https://assets.teleads.pro/sdk/taddy/index.js?v2');
          // @ts-ignore
          window.TeleAdsTMA.init({
            debug: this.taddy.config.debug,
            //endpointApi: 'https://api.stage.teleads.pro/api',
          });
        }
        this.taddy.debug('<TeleAds> Showtime...');
        let adLoaded = false;
        // @ts-ignore
        await window.TeleAdsTMA.showAd(result.data, {
          adUnitId: initData.teleAdsUnitId.toString(),
          onAdLoaded: () => (adLoaded = true),
        });
        this.taddy.debug('<TeleAds> finished', adLoaded);
        if (adLoaded) viewThrough(tag);
        if (config.onClosed) config.onClosed();
        resolve(adLoaded);
      } catch (error) {
        console.error('<TeleAds>', error);
        resolve(false);
      }
    });
  };

  private playmaticProvider = async (
    initData: ResourceInitData,
    config: InterstitialConfig,
    viewThrough: (id: string) => void,
  ): Promise<boolean> => {
    if (this.taddy.config.disablePlaymaticProvider || !initData.playmatic) {
      this.taddy.debug('Skipping Playmatic');
      return false;
    }
    this.taddy.debug('<Playmatic> Processing...');
    return window
      .fetch(
        `https://vast.ufouxbwn.com/vast.php?partner_id=7371124&format=4&set=6225881&referrer=app.${initData.username}`,
      )
      .then((res) => res.text())
      .then(
        (xml) =>
          new Promise(async (resolve) => {
            if (xml.length <= 27) {
              this.taddy.debug('<Playmatic>', 'Empty VAST');
              return resolve(false);
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'text/xml');
            const pricing = doc.getElementsByTagName('Pricing')[0];
            if (!pricing) {
              this.taddy.debug('<Playmatic>', 'Empty pricing');
              return resolve(false);
            }
            const model = pricing.getAttribute('model')?.toLowerCase(); // "CPM"
            const currency = pricing.getAttribute('currency'); // "USD"
            const cost = Number(pricing.textContent); // || 1.23; // "123.45"
            if (cost <= 0) {
              this.taddy.debug('<Playmatic>', 'Empty cost');
              return resolve(false);
            }
            const creative = doc.getElementsByTagName('Creative')[0];
            if (!creative) {
              this.taddy.debug('<Playmatic>', 'Empty creative');
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
            window.pmCallBack = (act: string) => {
              if (act === 'show mfs') {
                this.taddy.debug('<Playmatic>', 'IMPRESSION');
                this.sendImpression({ id: tag } as Ad);
              }
              if (act === 'click mfs') {
                this.taddy.debug('<Playmatic>', 'CLICK');
                this.sendClick({ id: tag } as Ad);
              }
              if (act === 'stop mfs') {
                this.taddy.debug('<Playmatic>', 'AD CLOSED');
                viewThrough(tag);
                if (config.onClosed) config.onClosed();
                return resolve(true);
              }
            };
            // @ts-ignore
            if (typeof window.PMTGVPAID === 'undefined') {
              this.taddy.debug('<Playmatic> Attaching SDK...');
              await loadJs('https://cdnwidget.simplejsmenu.com/dist/union/dev/pm.tg.vpaid.js');
            }
            this.taddy.debug('<Playmatic> Showtime...');
            // @ts-ignore
            window.PMTGVPAID.Mfs.start(xml);
          }),
      );
  };
}
