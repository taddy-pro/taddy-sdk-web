import { Ad, InterstitialConfig } from '../types';
import { createRoot } from 'react-dom/client';
import InterstitialImage from './interstitial-image';
import InterstitialVideo from './interstitial-video';
import './interstitial.scss';

interface Props {
  ad: Ad;
  click(): void;
  close(): void;
}

export const Interstitial = ({ ad, click, close }: Props) => {
  return (
    <div className="taddy__interstitial">
      {ad.image && <InterstitialImage ad={ad} click={click} close={close} />}
      {ad.video && <InterstitialVideo ad={ad} click={click} close={close} />}
    </div>
  );
};

export const showInterstitial = (ad: Ad, config: InterstitialConfig): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.getElementsByTagName('body')[0].appendChild(div);
    const close = () => {
      div.remove();
      if (config.onClosed) config.onClosed();
      resolve(true);
    };
    const click = () => {
      console.log('Click!');
      window.Telegram.WebApp.openLink(ad.link, {
        // @ts-ignore
        try_browser: 'chrome',
        try_instant_view: false,
      });
    };
    createRoot(div).render(<Interstitial ad={ad} click={click} close={close} />);
  });
};
