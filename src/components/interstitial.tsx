import { Ad, InterstitialConfig } from '../types';
import { createRoot } from 'react-dom/client';
import InterstitialImage from './interstitial-image';
import InterstitialVideo from './interstitial-video';
import './interstitial.scss';

import { TaddyWeb } from '../taddy';

interface Props {
  ad: Ad;
  click(): void;
  close(): void;
  viewThrough(): void;
}

export const Interstitial = ({ ad, click, close, viewThrough }: Props) => {
  return (
    <div className="taddy__interstitial">
      {ad.image && <InterstitialImage ad={ad} click={click} close={close} viewThrough={viewThrough} />}
      {ad.video && <InterstitialVideo ad={ad} click={click} close={close} viewThrough={viewThrough} />}
    </div>
  );
};

export const showInterstitial = (ad: Ad, config: InterstitialConfig, taddy: TaddyWeb): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.getElementsByTagName('body')[0].appendChild(div);
    const close = () => {
      div.remove();
      if (config.onClosed) config.onClosed();
      resolve(true);
    };
    let isViewThrough = false;
    const viewThrough = () => {
      if (isViewThrough) return;
      isViewThrough = true;
      void taddy.call('/ads/view-through', { id: ad.id });
      if (config.onViewThrough) config.onViewThrough(ad.id);
    };
    const click = () => {
      window.Telegram.WebApp.openLink(ad.link);
      // window.Telegram.WebApp.openLink(ad.link, { try_instant_view: false });
    };
    createRoot(div).render(<Interstitial ad={ad} click={click} close={close} viewThrough={viewThrough} />);
  });
};
