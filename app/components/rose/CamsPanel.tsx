import { useEffect, useRef, useState } from 'react';
import type { Camera, Sourced } from '../../services/stationData';
import { MT_ROSE } from '../../config/mtrose';

const REFRESH_MS = 60_000;
const ignore = () => undefined;

function CamTile({ cam, tick }: { cam: Camera; tick: number }) {
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Live mode: Safari plays HLS natively; everywhere else load hls.js on demand.
  useEffect(() => {
    if (!live || !cam.videoUrl) return;
    const video = videoRef.current;
    const src = cam.videoUrl;
    if (!video) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.play().catch(ignore);
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        const h = new Hls({ lowLatencyMode: true });
        h.loadSource(src);
        h.attachMedia(video);
        h.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(ignore));
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [live, cam.videoUrl]);

  return (
    <figure className={`cam${live ? ' is-live' : ''}`}>
      <div className="cam-frame">
        {live && cam.videoUrl ? (
          <video ref={videoRef} muted playsInline controls={false} aria-label={`Live video, ${cam.location}`} />
        ) : failed ? (
          <div className="cam-off">Camera offline</div>
        ) : (
          <img
            src={`${cam.imageUrl}?t=${tick}`}
            alt={cam.location}
            loading="lazy"
            onError={() => setFailed(true)}
            onLoad={() => setFailed(false)}
          />
        )}
        {cam.videoUrl && !failed && (
          <button type="button" className="cam-toggle" onClick={() => setLive((v) => !v)}>
            {live ? 'Stop' : 'Play live'}
          </button>
        )}
        {live && <span className="cam-live-dot" aria-hidden="true" />}
      </div>
      <figcaption>
        <span className="cam-label">{cam.label}</span>
        <span className="cam-loc">{cam.location}</span>
      </figcaption>
    </figure>
  );
}

export function CamsPanel({ cams }: { cams: Sourced<Camera[]> | null }) {
  // Stills refresh upstream about once a minute; bump a cache-buster on the
  // same cadence. Starts at 0 so the prerender and first client render agree.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="rose-section">
      <div className="sec-head">
        <h2>Live cams on the highway</h2>
        <span className="rule" />
        <a className="sec-link" href={MT_ROSE.links.cams} target="_blank" rel="noreferrer">
          Resort cams at skirose.com ↗
        </a>
      </div>
      {!cams ? (
        <div className="cams-grid">
          {Array.from({ length: 4 }).map((_, i) => <div className="skel cam-skel" key={i} />)}
        </div>
      ) : (
        <div className="cams-grid">
          {cams.data.map((c) => <CamTile key={c.id} cam={c} tick={tick} />)}
          <a className="cam cam-link" href={MT_ROSE.links.cams} target="_blank" rel="noreferrer">
            <span className="cam-frame cam-link-frame">
              <span className="cam-link-title">On the mountain</span>
              <span className="cam-link-sub">Summit, lodge and lift cams on skirose.com ↗</span>
            </span>
            <span className="cam-label">Resort cams</span>
          </a>
        </div>
      )}
      <p className="rose-foot-note">
        NDOT cameras along SR-431, Reno side to Incline. Stills refresh every minute; press play for the live stream.
      </p>
    </section>
  );
}
