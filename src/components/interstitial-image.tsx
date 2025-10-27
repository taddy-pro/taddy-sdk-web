import { Ad } from '../types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Close } from './icons';

const InterstitialImage = ({
  ad,
  click,
  close,
  impression,
  viewThrough,
}: {
  ad: Ad;
  click(): void;
  close(): void;
  impression(): void;
  viewThrough(): void;
}) => {
  const [time, setTime] = useState(15);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const t = time - 1;
    if (t === 5) {
      viewThrough();
    }
    if (t === 14) {
      impression();
    }
    if (t >= 0) {
      setTime(t);
      timer.current = setTimeout(tick, 1000);
    } else {
      close();
    }
  }, [time, setTime]);

  const showButton = useMemo(() => {
    return time <= 12;
  }, [time]);

  const canClose = useMemo(() => {
    return time <= 5;
  }, [time]);

  useEffect(() => {
    timer.current = setTimeout(tick, 1000);
    return () => {
      timer.current && clearTimeout(timer.current);
    };
  }, [timer, tick]);

  return (
    <div className="taddy__interstitial__image">
      {canClose && (
        <button className="taddy__interstitial__image__close" onClick={close}>
          <Close color={window.Telegram.WebApp.themeParams.bg_color} />
        </button>
      )}
      <div className="taddy__interstitial__image__spacer" />
      <div className="taddy__interstitial__image__card" onClick={click}>
        <div className="taddy__interstitial__image__card__image">
          <div
            className="taddy__interstitial__image__card__image__blur"
            style={{ backgroundImage: `url(${ad.image!})` }}
          />
          <img alt="" src={ad.image!} />
        </div>
        <span className="taddy__interstitial__image__card__title">{ad.title}</span>
        <span className="taddy__interstitial__image__card__description">{ad.description}</span>
      </div>
      <button className={`taddy__interstitial__image__button ${showButton ? 'visible' : 'hidden'}`} onClick={click}>
        {ad.button}
      </button>
      <div className="taddy__interstitial__image__spacer" />
      <span className="taddy__interstitial__image__timer">00:{time < 10 ? `0${time}` : time}</span>
      <a
        href="https://taddy.pro/?utm_source=interstitial"
        target="_blank"
        className="taddy__interstitial__image__taddy"
      >
        @TaddyPro - ads in Telegram
      </a>
    </div>
  );
};

export default InterstitialImage;
