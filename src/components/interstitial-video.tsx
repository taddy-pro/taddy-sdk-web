import { Ad } from '../types';
import { useCallback, useEffect, useRef, useState } from 'preact/compat';
import { Close, Sound } from './icons';

const InterstitialVideo = ({
  ad,
  click,
  close,
  viewThrough,
}: {
  ad: Ad;
  click(): void;
  close(): void;
  viewThrough(): void;
}) => {
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [canClose, setCanClose] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (!canClose && video.currentTime >= 15) {
        setCanClose(true);
        viewThrough();
      }
    };

    const handleVideoEnd = () => {
      setShowInfo(true);
      if (!canClose) {
        setCanClose(true);
        viewThrough();
      }
      setTimeout(close, 5000);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [canClose]);

  const videoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (currentTime >= duration) {
      click();
    } else {
      video.paused ? video.play() : video.pause();
    }
  }, [videoRef, currentTime, duration, click]);

  return (
    <div className="taddy__interstitial__video">
      <video
        className={showInfo ? 'blur' : ''}
        src={ad.video!}
        muted={muted}
        autoPlay
        ref={videoRef}
        onClick={videoClick}
      />

      <div className="taddy__interstitial__video__head">
        <div className="taddy__interstitial__video__head__progress">
          <div
            className="taddy__interstitial__video__head__progress__value"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="taddy__interstitial__video__head__controls">
          <div className="taddy__interstitial__video__head__controls__sound" onClick={() => setMuted(!muted)}>
            <Sound enabled={!muted} />
          </div>
          <a
            href="https://taddy.pro/?utm_source=interstitial"
            target="_blank"
            className="taddy__interstitial__video__head__controls__taddy"
          >
            @TaddyPro - ads in Telegram
          </a>
          <div
            className={`taddy__interstitial__video__head__controls__close ${canClose || showInfo ? 'taddy__interstitial__video__head__controls__close-visible' : 'taddy__interstitial__video__head__controls__close-hidden'}`}
            onClick={close}
          >
            <Close />
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="taddy__interstitial__video__info" onClick={click}>
          {ad.icon && <img className="taddy__interstitial__video__info__icon" src={ad.icon} alt="" />}
          {ad.title && <div className="taddy__interstitial__video__info__title">{ad.title}</div>}
          {ad.description && <div className="taddy__interstitial__video__info__description">{ad.description}</div>}
        </div>
      )}

      <div className="taddy__interstitial__video__footer">
        <button
          className={`taddy__interstitial__video__footer__button ${currentTime >= 5 ? 'taddy__interstitial__video__footer__button-visible' : '-taddy__interstitial__video__footer__button-hidden'}`}
          onClick={click}
        >
          {ad.button}
        </button>
      </div>
    </div>
  );
};
export default InterstitialVideo;
