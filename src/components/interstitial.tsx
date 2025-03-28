import { Ad, InterstitialConfig } from '../types';
import { createRoot } from 'react-dom/client';
import InterstitialImage from './interstitial-image';
import './interstitial.scss';

export const Interstitial = ({ ad, click, close }: { ad: Ad; click(): void; close(): void }) => {
  return (
    <div className="taddy__interstitial">
      {ad.image && <InterstitialImage ad={ad} click={click} close={close} />}
      {ad.video && (
        <div>
          <p>Формат еще не поддерживается</p>
          <button onClick={close}>Закрыть</button>
        </div>
      )}
    </div>
  );
};

export const showInterstitial = (ad: Ad, config: InterstitialConfig): Promise<boolean> => {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.getElementsByTagName('body')[0].appendChild(div);
    const close = () => {
      div.remove();
      config.onClosed();
      resolve(true);
    };
    const click = () => {
      window.Telegram.WebApp.openLink(ad.link);
      // window.open(ad.link);
      //close();
    };
    createRoot(div).render(<Interstitial ad={ad} click={click} close={close} />);
  });
};
