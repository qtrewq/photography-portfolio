import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize
} from 'lucide-react';
import './PageView.css';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/* ─── Slide Background ─── */
const SlideBackground = ({ bg }) => {
  if (!bg) return <div style={{ position: 'absolute', inset: 0, background: '#121212' }} />;
  if (bg.type === 'image' && bg.image) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${bg.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />
    );
  }
  if (bg.type === 'gradient') {
    return <div style={{ position: 'absolute', inset: 0, background: bg.value || '#121212' }} />;
  }
  return <div style={{ position: 'absolute', inset: 0, background: bg.value || '#121212' }} />;
};

/* ─── Block Renderer ─── */
const BlockView = ({ block }) => {
  const style = {
    position: 'absolute',
    left: `${block.x}px`,
    top: `${block.y}px`,
    width: `${block.width}px`,
    height: `${block.height}px`,
    zIndex: block.zIndex || 1,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  if (block.type === 'text') {
    return (
      <div style={style}>
        <div style={{
          padding: '1.5rem',
          height: '100%',
          overflow: 'hidden',
          lineHeight: 1.6,
          fontSize: '1.5rem',
        }}>
          <ReactMarkdown>{block.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (block.type === 'photo') {
    return (
      <div style={{ ...style, borderRadius: '4px', overflow: 'hidden' }}>
        {block.url ? (
          <>
            <img
              src={block.url}
              alt={block.caption || ''}
              style={{ width: '100%', height: '100%', objectFit: block.objectFit || 'cover', display: 'block' }}
            />
            {block.caption && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                color: 'white', padding: '2rem 1.5rem 1rem',
                fontSize: '1.1rem', lineHeight: 1.4,
              }}>
                {block.caption}
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  if (block.type === 'glass') {
    return (
      <div style={{
        ...style,
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        borderRadius: '16px',
      }} />
    );
  }

  if (block.type === 'carousel') {
    const photos = block.photos || [];
    const [carouselIdx, setCarouselIdx] = useState(0);

    useEffect(() => {
      if (photos.length <= 1) return;
      const timer = setInterval(() => setCarouselIdx(i => (i + 1) % photos.length), 3500);
      return () => clearInterval(timer);
    }, [photos.length]);

    if (!photos.length) return null;
    return (
      <div style={{ ...style, overflow: 'hidden', borderRadius: '4px' }}>
        <img
          src={photos[carouselIdx]?.url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.5s ease' }}
        />
        {photos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '1rem', left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: '0.6rem',
          }}>
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIdx(i)}
                style={{
                  width: i === carouselIdx ? '24px' : '8px', height: '8px',
                  borderRadius: '9999px',
                  background: i === carouselIdx ? 'white' : 'rgba(255,255,255,0.4)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

/* ─── Single Slide Pane ─── */
const SlidePane = ({ slide, state, transition }) => {
  // state: 'active' | 'prev' | 'hidden'
  let transform = 'none';
  let opacity = 0;
  let visibility = 'hidden';

  if (state === 'active') { opacity = 1; visibility = 'visible'; transform = 'none'; }
  else if (state === 'prev') { visibility = 'hidden'; opacity = 0; }

  if (transition === 'slide') {
    if (state === 'active') transform = 'translateX(0)';
    else if (state === 'hidden-right') { transform = 'translateX(100%)'; visibility = 'visible'; opacity = 0; }
    else if (state === 'hidden-left') { transform = 'translateX(-100%)'; visibility = 'visible'; opacity = 0; }
  } else if (transition === 'zoom') {
    if (state === 'active') transform = 'scale(1)';
    else if (state === 'hidden') transform = 'scale(0.95)';
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      opacity,
      visibility,
      transform,
      transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <SlideBackground bg={slide.background} />
      {slide.blocks?.map(block => (
        <BlockView key={block.id} block={block} />
      ))}
    </div>
  );
};

/* ═══════════ PAGE VIEW COMPONENT ═══════════ */
const PageView = ({ page }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef(null);
  const playTimer = useRef(null);
  const AUTO_PLAY_INTERVAL = 5000;

  const slides = page?.slides || [];
  const total = slides.length;

  /* ── Scale canvas to fit viewport ── */
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = clientWidth / CANVAS_W;
      const scaleY = clientHeight / CANVAS_H;
      setScale(Math.min(scaleX, scaleY));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Navigation ── */
  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= total) return;
    setPrevIdx(activeIdx);
    setActiveIdx(idx);
  }, [activeIdx, total]);

  const goNext = useCallback(() => goTo((activeIdx + 1) % total), [goTo, activeIdx, total]);
  const goPrev = useCallback(() => goTo((activeIdx - 1 + total) % total), [goTo, activeIdx, total]);

  /* ── Auto-play ── */
  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(goNext, AUTO_PLAY_INTERVAL);
    }
    return () => clearInterval(playTimer.current);
  }, [isPlaying, goNext]);

  /* ── Keyboard Events ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'Escape' && isFullscreen) document.exitFullscreen?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, isFullscreen]);

  /* ── Fullscreen tracking ── */
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  /* ── Controls auto-hide ── */
  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  /* ── Touch / Swipe ── */
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
    touchStart.current = null;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!page || slides.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(255,255,255,0.4)' }}>
        <p>No slides on this page yet. Open the editor to add some!</p>
      </div>
    );
  }

  return (
    <div
      className="page-view-fullscreen"
      ref={containerRef}
      onMouseMove={showControls}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas wrapper — scales down to viewport */}
      <div
        className="slide-scale-container"
        style={{
          width: `${CANVAS_W}px`,
          height: `${CANVAS_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Render all slides, only active is visible */}
        {slides.map((slide, idx) => (
          <SlidePane
            key={slide.id}
            slide={slide}
            state={idx === activeIdx ? 'active' : 'prev'}
            transition={slide.transition || 'fade'}
          />
        ))}
      </div>

      {/* ── Floating Glassmorphism Presenter Controls ── */}
      <div
        className="presenter-controls-floating"
        style={{ opacity: controlsVisible ? 0.95 : 0, transition: 'opacity 0.5s ease' }}
      >
        <button
          className="control-btn-icon"
          onClick={goPrev}
          title="Previous (←)"
          disabled={total <= 1}
        >
          <ChevronLeft size={18} />
        </button>

        <span className="slide-counter-badge">
          {activeIdx + 1} / {total}
        </span>

        <button
          className="control-btn-icon"
          onClick={() => setIsPlaying(p => !p)}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          className="control-btn-icon"
          onClick={goNext}
          title="Next (→)"
          disabled={total <= 1}
        >
          <ChevronRight size={18} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

        <button
          className="control-btn-icon"
          onClick={toggleFullscreen}
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* Slide progress dots */}
      {total > 1 && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.5rem', zIndex: 998,
          opacity: controlsVisible ? 1 : 0, transition: 'opacity 0.5s ease',
        }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              style={{
                width: idx === activeIdx ? '20px' : '6px',
                height: '6px',
                borderRadius: '9999px',
                background: idx === activeIdx ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PageView;
