import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Moveable from 'react-moveable';
import ReactMarkdown from 'react-markdown';
import {
  LogOut, Save, Plus, Trash2, Type, Image as ImageIcon,
  Copy, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  Layout, Play, Upload, X, FileText, Layers
} from 'lucide-react';
import { themes } from '../themeTemplates';
import './AdminEditor.css';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const GRADIENT_PRESETS = [
  { label: 'Midnight', value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { label: 'Volcanic', value: 'linear-gradient(135deg, #200122, #6f0000)' },
  { label: 'Northern Lights', value: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
  { label: 'Golden Hour', value: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
  { label: 'Deep Forest', value: 'linear-gradient(135deg, #0a2e0a, #1a3a1a, #0d280d)' },
  { label: 'Ember', value: 'linear-gradient(135deg, #1c0a00, #3d1500, #6b2500)' },
];

const SOLID_PRESETS = [
  '#121212', '#1a1a1a', '#0f172a', '#0c0c0c', '#18181b',
  '#1e293b', '#0a0a0a', '#14161a', '#1a0a1a', '#0a1a0a',
];

const createNewBlock = (type) => {
  const base = { id: 'b_' + Date.now(), type, zIndex: 1 };
  switch (type) {
    case 'text':
      return { ...base, content: '## New Title\n\nDouble-click to edit this text block.', x: 200, y: 200, width: 700, height: 250 };
    case 'photo':
      return { ...base, url: '', caption: '', objectFit: 'cover', x: 100, y: 100, width: 800, height: 600 };
    case 'glass':
      return { ...base, x: 50, y: 50, width: 500, height: 300 };
    case 'carousel':
      return { ...base, photos: [], x: 100, y: 100, width: 900, height: 600 };
    default:
      return base;
  }
};

const createNewSlide = () => ({
  id: 's_' + Date.now(),
  background: { type: 'color', value: '#121212', image: null },
  transition: 'fade',
  blocks: [],
});

/* ─────────── Slide Background Renderer ─────────── */
const SlideBackground = ({ bg }) => {
  if (!bg) return null;
  if (bg.type === 'image' && bg.image) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${bg.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0,
      }} />
    );
  }
  if (bg.type === 'gradient') {
    return <div style={{ position: 'absolute', inset: 0, background: bg.value, zIndex: 0 }} />;
  }
  // solid color
  return <div style={{ position: 'absolute', inset: 0, background: bg.value || '#121212', zIndex: 0 }} />;
};

/* ─────────── Block Renderer ─────────── */
const BlockRenderer = ({ block, isSelected, isEditing, onDoubleClick, onUpdate, onUploadRequest }) => {
  if (block.type === 'text') {
    return (
      <div className="editable-text-container" onDoubleClick={onDoubleClick}>
        {isEditing ? (
          <textarea
            className="editable-text-area"
            value={block.content}
            autoFocus
            onChange={e => onUpdate({ content: e.target.value })}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="markdown-rendered-view">
            <ReactMarkdown>{block.content}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'photo') {
    return (
      <div className="photo-block-wrapper">
        {block.url ? (
          <>
            <img
              src={block.url}
              alt={block.caption || ''}
              className="photo-block-image"
              style={{ objectFit: block.objectFit || 'cover' }}
            />
            {block.caption && <div className="photo-block-caption">{block.caption}</div>}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', flexDirection: 'column', gap: '1rem' }}>
            <ImageIcon size={48} strokeWidth={1} />
            <span style={{ fontSize: '1.2rem' }}>Click to add photo</span>
          </div>
        )}
        {isSelected && (
          <button className="upload-overlay" onClick={e => { e.stopPropagation(); onUploadRequest(block.id, 'photo'); }}>
            <Upload size={14} /> Upload Photo
          </button>
        )}
      </div>
    );
  }

  if (block.type === 'glass') {
    return <div className="glass-overlay-card" />;
  }

  if (block.type === 'carousel') {
    const photos = block.photos || [];
    const [carouselIdx, setCarouselIdx] = React.useState(0);
    return (
      <div className="carousel-block-wrapper">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[carouselIdx]?.url}
              alt=""
              className="carousel-slide-active"
            />
            <div style={{ position: 'absolute', bottom: '1rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-nav-dot ${i === carouselIdx ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); setCarouselIdx(i); }}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', flexDirection: 'column', gap: '1rem' }}>
            <Layout size={48} strokeWidth={1} />
            <span style={{ fontSize: '1.2rem' }}>Carousel — add photos in Properties</span>
          </div>
        )}
        {isSelected && (
          <button className="upload-overlay" onClick={e => { e.stopPropagation(); onUploadRequest(block.id, 'carousel'); }}>
            <Upload size={14} /> Add Photo
          </button>
        )}
      </div>
    );
  }

  return null;
};

/* ═══════════ MAIN EDITOR COMPONENT ═══════════ */
const AdminEditor = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  const [pages, setPages] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    title: '', bio: '', typography: 'sans', navigationLayout: 'top', footerText: ''
  });
  const [selectedTheme, setSelectedTheme] = useState('classicDark');
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rightTab, setRightTab] = useState('insert'); // insert | slide | block | pages | settings

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [canvasScale, setCanvasScale] = useState(0.5);
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  /* ─── Load Data ─── */
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      try {
        const res = await fetch('/api/portfolio');
        if (res.ok) {
          const data = await res.json();
          const ps = data.pages || [];
          setPages(ps);
          setSiteSettings({ title: '', bio: '', typography: 'sans', navigationLayout: 'top', footerText: '', ...(data.settings || {}) });
          setSelectedTheme(data.theme || 'classicDark');
          if (ps.length > 0) setSelectedPageId(ps[0].id);
        }
      } catch (err) { console.warn('Failed to load portfolio', err); }
    };
    load();
  }, [isAuthenticated]);

  /* ─── Scale canvas to fit workspace ─── */
  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      const scaleX = (clientWidth - 96) / CANVAS_W;
      const scaleY = (clientHeight - 96) / CANVAS_H;
      setCanvasScale(Math.min(scaleX, scaleY, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  /* ─── Helpers ─── */
  const selectedPage = pages.find(p => p.id === selectedPageId);
  const slides = selectedPage?.slides || [];
  const activeSlide = slides[activeSlideIdx] || null;
  const selectedBlock = activeSlide?.blocks?.find(b => b.id === selectedBlockId) || null;

  const updatePages = (updater) => setPages(prev => prev.map(p => p.id === selectedPageId ? updater(p) : p));
  const updateSlide = (slideId, updates) => updatePages(p => ({
    ...p,
    slides: p.slides.map(s => s.id === slideId ? { ...s, ...updates } : s)
  }));
  const updateBlock = (blockId, updates) => updatePages(p => ({
    ...p,
    slides: p.slides.map(s => s.id === activeSlide.id ? {
      ...s,
      blocks: s.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
    } : s)
  }));
  const deleteBlock = (blockId) => {
    updatePages(p => ({
      ...p,
      slides: p.slides.map(s => s.id === activeSlide.id ? {
        ...s, blocks: s.blocks.filter(b => b.id !== blockId)
      } : s)
    }));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  /* ─── Slide Operations ─── */
  const addSlide = () => {
    const ns = createNewSlide();
    updatePages(p => ({ ...p, slides: [...p.slides, ns] }));
    setActiveSlideIdx(slides.length);
    setSelectedBlockId(null);
  };

  const duplicateSlide = (idx) => {
    const orig = slides[idx];
    const dupe = {
      ...JSON.parse(JSON.stringify(orig)),
      id: 's_' + Date.now(),
      blocks: orig.blocks.map(b => ({ ...b, id: 'b_' + Date.now() + '_' + Math.random() })),
    };
    updatePages(p => {
      const newSlides = [...p.slides];
      newSlides.splice(idx + 1, 0, dupe);
      return { ...p, slides: newSlides };
    });
    setActiveSlideIdx(idx + 1);
  };

  const deleteSlide = (idx) => {
    if (slides.length <= 1) return;
    updatePages(p => {
      const newSlides = p.slides.filter((_, i) => i !== idx);
      return { ...p, slides: newSlides };
    });
    setActiveSlideIdx(Math.max(0, idx - 1));
    setSelectedBlockId(null);
  };

  const moveSlide = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    updatePages(p => {
      const newSlides = [...p.slides];
      [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
      return { ...p, slides: newSlides };
    });
    setActiveSlideIdx(newIdx);
  };

  /* ─── Block Operations ─── */
  const addBlock = (type) => {
    if (!activeSlide) return;
    const nb = createNewBlock(type);
    updatePages(p => ({
      ...p,
      slides: p.slides.map(s => s.id === activeSlide.id ? { ...s, blocks: [...s.blocks, nb] } : s)
    }));
    setSelectedBlockId(nb.id);
    setRightTab('block');
  };

  /* ─── Page Operations ─── */
  const addPage = () => {
    const title = prompt('Enter new page name:');
    if (!title) return;
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPage = { id, title, slides: [createNewSlide()] };
    setPages(prev => [...prev, newPage]);
    setSelectedPageId(id);
    setActiveSlideIdx(0);
    setSelectedBlockId(null);
  };

  const deletePage = (id) => {
    if (!window.confirm('Delete this page?')) return;
    setPages(prev => prev.filter(p => p.id !== id));
    if (selectedPageId === id) setSelectedPageId(pages.find(p => p.id !== id)?.id || null);
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages, settings: siteSettings, theme: selectedTheme }),
      });
      if (res.ok) alert('Saved! Reload the live site to see your changes.');
      else alert('Save failed.');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setIsSaving(false); }
  };

  /* ─── File Upload ─── */
  const handleUploadRequest = (blockId, type) => {
    setUploadTarget({ blockId, type });
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTarget) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 1920;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl }),
          });
          if (res.ok) {
            const { url } = await res.json();
            if (uploadTarget.type === 'photo') {
              updateBlock(uploadTarget.blockId, { url });
            } else if (uploadTarget.type === 'carousel') {
              const block = activeSlide?.blocks.find(b => b.id === uploadTarget.blockId);
              if (block) updateBlock(uploadTarget.blockId, { photos: [...(block.photos || []), { id: Date.now().toString(), url }] });
            } else if (uploadTarget.type === 'slide-bg') {
              updateSlide(activeSlide.id, { background: { type: 'image', value: '', image: url } });
            }
          } else alert('Upload failed.');
        } catch (err) { alert('Upload error: ' + err.message); }
        setUploadTarget(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  /* ─── Moveable drag/resize ─── */
  const moveableTarget = selectedBlockId && canvasRef.current
    ? canvasRef.current.querySelector(`.block-el-${selectedBlockId}`)
    : null;

  /* ─────────── Render: Not authenticated ─────────── */
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Incorrect password.');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication service.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: 'white' }}>
        <form onSubmit={handleLogin} className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 300, letterSpacing: '3px', fontSize: '1.5rem' }}>ADMIN ACCESS</h2>
          <p style={{ opacity: 0.5, marginBottom: '2rem', fontSize: '0.9rem' }}>Required to edit this portfolio</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="password" 
              placeholder="Enter password..." 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '1rem',
                textAlign: 'center'
              }}
            />
            {loginError && <p style={{ color: '#ff4757', fontSize: '0.85rem', margin: 0 }}>{loginError}</p>}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
            Enter Editor
          </button>
        </form>
      </div>
    );
  }

  /* ─────────── Render: Main Editor ─────────── */
  return (
    <div className="wysiwyg-editor fade-in">
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── TOP BAR ── */}
      <header className="editor-topbar">
        <div className="topbar-left">
          <h2>✦ Slide Editor</h2>
          <span className="page-indicator">
            {selectedPage ? selectedPage.title : 'No page selected'}
            {activeSlide ? ` · Slide ${activeSlideIdx + 1}/${slides.length}` : ''}
          </span>
        </div>
        <div className="topbar-right">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            <Play size={14} /> Preview
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={14} /> {isSaving ? 'Saving…' : 'Publish'}
          </button>
          <button className="btn-secondary" onClick={() => { localStorage.removeItem('adminToken'); setIsAuthenticated(false); }}>
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div className="editor-workspace">

        {/* ── LEFT: SLIDE THUMBNAILS ── */}
        <aside className="editor-left-sidebar">
          <div className="sidebar-header">
            <h3>Slides</h3>
            <button className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={addSlide}>
              <Plus size={14} />
            </button>
          </div>
          <div className="slide-list-scroll">
            {slides.map((slide, idx) => {
              const bg = slide.background;
              let bgStyle = {};
              if (bg?.type === 'color') bgStyle = { background: bg.value };
              else if (bg?.type === 'gradient') bgStyle = { background: bg.value };
              else if (bg?.type === 'image' && bg.image) bgStyle = { backgroundImage: `url(${bg.image})`, backgroundSize: 'cover' };
              return (
                <div
                  key={slide.id}
                  className={`slide-thumbnail-card ${idx === activeSlideIdx ? 'active' : ''}`}
                  onClick={() => { setActiveSlideIdx(idx); setSelectedBlockId(null); setEditingBlockId(null); }}
                >
                  <div className="slide-thumbnail-aspect">
                    <div className="slide-thumbnail-preview" style={bgStyle} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5, color: 'white', background: 'rgba(0,0,0,0.4)', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                        {slide.blocks?.length || 0} blocks
                      </span>
                    </div>
                  </div>
                  <div className="slide-thumbnail-info">
                    <span style={{ opacity: 0.7 }}>Slide {idx + 1}</span>
                    <div className="thumbnail-actions">
                      <button className="thumb-action-btn" title="Move Up" onClick={e => { e.stopPropagation(); moveSlide(idx, -1); }}><ChevronUp size={12} /></button>
                      <button className="thumb-action-btn" title="Move Down" onClick={e => { e.stopPropagation(); moveSlide(idx, 1); }}><ChevronDown size={12} /></button>
                      <button className="thumb-action-btn" title="Duplicate" onClick={e => { e.stopPropagation(); duplicateSlide(idx); }}><Copy size={12} /></button>
                      <button className="thumb-action-btn danger" title="Delete" onClick={e => { e.stopPropagation(); deleteSlide(idx); }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── CENTER: CANVAS WORKSPACE ── */}
        <div
          className="editor-center-workspace"
          ref={wrapperRef}
          onClick={() => { setSelectedBlockId(null); setEditingBlockId(null); }}
        >
          {activeSlide ? (
            <div
              className="canvas-scale-wrapper"
              style={{
                width: `${CANVAS_W * canvasScale}px`,
                height: `${CANVAS_H * canvasScale}px`,
              }}
            >
              <div
                className="editor-canvas"
                ref={canvasRef}
                style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
              >
                {/* Slide Background */}
                <SlideBackground bg={activeSlide.background} />

                {/* Blocks */}
                {activeSlide.blocks?.map(block => {
                  const isSelected = block.id === selectedBlockId;
                  const isEditing = block.id === editingBlockId;
                  return (
                    <div
                      key={block.id}
                      className={`canvas-block block-el-${block.id}`}
                      style={{
                        position: 'absolute',
                        left: `${block.x}px`,
                        top: `${block.y}px`,
                        width: `${block.width}px`,
                        height: `${block.height}px`,
                        zIndex: block.zIndex || 1,
                        outline: isSelected ? '2px solid #ff4757' : '2px solid transparent',
                        outlineOffset: '2px',
                        borderRadius: block.type === 'glass' ? '16px' : '0',
                        cursor: isSelected ? 'move' : 'pointer',
                        boxSizing: 'border-box',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                        setRightTab('block');
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        if (block.type === 'text') setEditingBlockId(block.id);
                      }}
                    >
                      {isSelected && (() => {
                        const allZ = activeSlide.blocks.map(b => b.zIndex || 1);
                        const maxZ = Math.max(...allZ, 1);
                        const minZ = Math.min(...allZ, 1);
                        const curZ = block.zIndex || 1;
                        const hasMultipleBlocks = activeSlide.blocks.length > 1;

                        return (
                          <div className="block-toolbar">
                            {/* Separator label */}
                            <span className="toolbar-label">Layer</span>
                            <div className="toolbar-divider" />

                            {/* Bring to Front */}
                            <button
                              title="Bring to Front"
                              disabled={!hasMultipleBlocks || curZ > maxZ}
                              onClick={e => { e.stopPropagation(); updateBlock(block.id, { zIndex: maxZ + 1 }); }}
                            >
                              <ChevronsUp size={13} />
                            </button>

                            {/* Bring Forward */}
                            <button
                              title="Bring Forward"
                              disabled={!hasMultipleBlocks}
                              onClick={e => { e.stopPropagation(); updateBlock(block.id, { zIndex: curZ + 1 }); }}
                            >
                              <ChevronUp size={13} />
                            </button>

                            {/* Send Backward */}
                            <button
                              title="Send Backward"
                              disabled={!hasMultipleBlocks}
                              onClick={e => { e.stopPropagation(); updateBlock(block.id, { zIndex: curZ - 1 }); }}
                            >
                              <ChevronDown size={13} />
                            </button>

                            {/* Send to Back */}
                            <button
                              title="Send to Back"
                              disabled={!hasMultipleBlocks || curZ < minZ}
                              onClick={e => { e.stopPropagation(); updateBlock(block.id, { zIndex: minZ - 1 }); }}
                            >
                              <ChevronsDown size={13} />
                            </button>

                            <div className="toolbar-divider" />

                            {/* Current z-index badge */}
                            <span className="toolbar-z-badge" title="Current layer">{curZ}</span>

                            <div className="toolbar-divider" />

                            {/* Delete */}
                            <button
                              className="danger"
                              title="Delete Block"
                              onClick={e => { e.stopPropagation(); deleteBlock(block.id); }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })()}
                      <BlockRenderer
                        block={block}
                        isSelected={isSelected}
                        isEditing={isEditing}
                        onDoubleClick={() => { if (block.type === 'text') setEditingBlockId(block.id); }}
                        onUpdate={updates => updateBlock(block.id, updates)}
                        onUploadRequest={handleUploadRequest}
                      />
                    </div>
                  );
                })}

                {/* Moveable drag/resize controller */}
                {moveableTarget && !editingBlockId && (
                  <Moveable
                    target={moveableTarget}
                    container={canvasRef.current}
                    draggable={true}
                    resizable={true}
                    snappable={true}
                    snapThreshold={10}
                    isDisplaySnapDigit={false}
                    verticalGuidelines={[0, CANVAS_W / 2, CANVAS_W]}
                    horizontalGuidelines={[0, CANVAS_H / 2, CANVAS_H]}
                    elementGuidelines={
                      activeSlide.blocks
                        .filter(b => b.id !== selectedBlockId)
                        .map(b => canvasRef.current?.querySelector(`.block-el-${b.id}`))
                        .filter(Boolean)
                    }
                    onDrag={({ target, left, top }) => {
                      target.style.left = `${left}px`;
                      target.style.top = `${top}px`;
                    }}
                    onDragEnd={({ lastEvent }) => {
                      if (lastEvent) updateBlock(selectedBlockId, { x: lastEvent.left, y: lastEvent.top });
                    }}
                    onResize={({ target, width, height, drag }) => {
                      target.style.width = `${width}px`;
                      target.style.height = `${height}px`;
                      target.style.left = `${drag.left}px`;
                      target.style.top = `${drag.top}px`;
                    }}
                    onResizeEnd={({ lastEvent }) => {
                      if (lastEvent) {
                        updateBlock(selectedBlockId, {
                          width: lastEvent.width,
                          height: lastEvent.height,
                          x: lastEvent.drag.left,
                          y: lastEvent.drag.top,
                        });
                      }
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              <FileText size={48} strokeWidth={1} style={{ margin: '0 auto 1rem' }} />
              <p>Select a page from the Pages tab</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: PROPERTIES SIDEBAR ── */}
        <aside className="editor-sidebar">
          <div className="sidebar-tabs">
            <button className={rightTab === 'insert' ? 'active' : ''} onClick={() => setRightTab('insert')}>Insert</button>
            <button className={rightTab === 'slide' ? 'active' : ''} onClick={() => setRightTab('slide')}>Slide</button>
            <button className={rightTab === 'block' ? 'active' : ''} onClick={() => setRightTab('block')}>Block</button>
            <button className={rightTab === 'pages' ? 'active' : ''} onClick={() => setRightTab('pages')}>Pages</button>
          </div>

          <div className="sidebar-content">

            {/* ── INSERT TAB ── */}
            {rightTab === 'insert' && (
              <>
                <div>
                  <div className="section-title">Add Element</div>
                  <div className="insert-grid">
                    <button onClick={() => addBlock('text')} disabled={!activeSlide}>
                      <Type size={22} strokeWidth={1.5} />
                      <span>Text Box</span>
                    </button>
                    <button onClick={() => addBlock('photo')} disabled={!activeSlide}>
                      <ImageIcon size={22} strokeWidth={1.5} />
                      <span>Photo</span>
                    </button>
                    <button onClick={() => addBlock('glass')} disabled={!activeSlide}>
                      <Layers size={22} strokeWidth={1.5} />
                      <span>Glass Card</span>
                    </button>
                    <button onClick={() => addBlock('carousel')} disabled={!activeSlide}>
                      <Layout size={22} strokeWidth={1.5} />
                      <span>Carousel</span>
                    </button>
                  </div>
                  {!activeSlide && <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Select a page to start adding elements.</p>}
                </div>
                <div>
                  <div className="section-title">Add Slide</div>
                  <button className="btn-secondary" style={{ width: '100%' }} onClick={addSlide} disabled={!activeSlide}>
                    <Plus size={14} /> New Slide
                  </button>
                </div>
              </>
            )}

            {/* ── SLIDE TAB ── */}
            {rightTab === 'slide' && activeSlide && (
              <>
                <div>
                  <div className="section-title">Background Type</div>
                  <div className="form-group">
                    <select
                      value={activeSlide.background?.type || 'color'}
                      onChange={e => updateSlide(activeSlide.id, { background: { ...activeSlide.background, type: e.target.value } })}
                    >
                      <option value="color">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {activeSlide.background?.type === 'color' && (
                  <>
                    <div>
                      <div className="section-title">Color Presets</div>
                      <div className="swatches-grid">
                        {SOLID_PRESETS.map(color => (
                          <button
                            key={color}
                            className={`swatch-btn ${activeSlide.background?.value === color ? 'active' : ''}`}
                            style={{ background: color }}
                            onClick={() => updateSlide(activeSlide.id, { background: { ...activeSlide.background, value: color } })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Custom Color</label>
                      <input
                        type="text"
                        value={activeSlide.background?.value || '#121212'}
                        onChange={e => updateSlide(activeSlide.id, { background: { ...activeSlide.background, value: e.target.value } })}
                        placeholder="#121212"
                      />
                    </div>
                  </>
                )}

                {activeSlide.background?.type === 'gradient' && (
                  <div>
                    <div className="section-title">Gradient Presets</div>
                    <div className="gradient-presets-list">
                      {GRADIENT_PRESETS.map(g => (
                        <button
                          key={g.label}
                          className={`gradient-preset-item ${activeSlide.background?.value === g.value ? 'active' : ''}`}
                          style={{ background: g.value }}
                          onClick={() => updateSlide(activeSlide.id, { background: { ...activeSlide.background, value: g.value } })}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSlide.background?.type === 'image' && (
                  <div>
                    <div className="section-title">Background Photo</div>
                    {activeSlide.background?.image ? (
                      <div style={{ marginBottom: '0.75rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <img src={activeSlide.background.image} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                      </div>
                    ) : null}
                    <button className="btn-secondary" style={{ width: '100%' }} onClick={() => handleUploadRequest(null, 'slide-bg')}>
                      <Upload size={14} /> Upload Background
                    </button>
                    <div className="form-group" style={{ marginTop: '0.75rem' }}>
                      <label>Or paste URL</label>
                      <input
                        type="text"
                        value={activeSlide.background?.image || ''}
                        placeholder="https://..."
                        onChange={e => updateSlide(activeSlide.id, { background: { ...activeSlide.background, image: e.target.value } })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="section-title">Transition</div>
                  <div className="form-group">
                    <select
                      value={activeSlide.transition || 'fade'}
                      onChange={e => updateSlide(activeSlide.id, { transition: e.target.value })}
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {rightTab === 'slide' && !activeSlide && (
              <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>Select a slide to edit its properties.</p>
            )}

            {/* ── BLOCK TAB ── */}
            {rightTab === 'block' && selectedBlock && (
              <>
                <div>
                  <div className="section-title">Position & Size</div>
                  <div className="coords-grid">
                    <div className="form-group">
                      <label>X</label>
                      <input type="number" value={Math.round(selectedBlock.x)} onChange={e => updateBlock(selectedBlock.id, { x: +e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Y</label>
                      <input type="number" value={Math.round(selectedBlock.y)} onChange={e => updateBlock(selectedBlock.id, { y: +e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Width</label>
                      <input type="number" value={Math.round(selectedBlock.width)} onChange={e => updateBlock(selectedBlock.id, { width: +e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Height</label>
                      <input type="number" value={Math.round(selectedBlock.height)} onChange={e => updateBlock(selectedBlock.id, { height: +e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Z-Index (Layer)</label>
                  <input type="number" value={selectedBlock.zIndex || 1} onChange={e => updateBlock(selectedBlock.id, { zIndex: +e.target.value })} />
                </div>

                {selectedBlock.type === 'photo' && (
                  <>
                    <div className="form-group">
                      <label>Caption</label>
                      <input type="text" value={selectedBlock.caption || ''} onChange={e => updateBlock(selectedBlock.id, { caption: e.target.value })} placeholder="Optional caption…" />
                    </div>
                    <div className="form-group">
                      <label>Object Fit</label>
                      <select value={selectedBlock.objectFit || 'cover'} onChange={e => updateBlock(selectedBlock.id, { objectFit: e.target.value })}>
                        <option value="cover">Cover (crop to fill)</option>
                        <option value="contain">Contain (show full image)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input type="text" value={selectedBlock.url || ''} onChange={e => updateBlock(selectedBlock.id, { url: e.target.value })} placeholder="https://..." />
                    </div>
                    <button className="btn-secondary" style={{ width: '100%' }} onClick={() => handleUploadRequest(selectedBlock.id, 'photo')}>
                      <Upload size={14} /> Upload Photo
                    </button>
                  </>
                )}

                {selectedBlock.type === 'carousel' && (
                  <>
                    <div className="section-title">Carousel Photos</div>
                    <div className="carousel-items-editor">
                      {(selectedBlock.photos || []).map((photo, i) => (
                        <div key={photo.id || i} className="carousel-edit-row">
                          <input
                            type="text"
                            className="form-group input"
                            value={photo.url}
                            placeholder="Image URL…"
                            onChange={e => {
                              const photos = [...(selectedBlock.photos || [])];
                              photos[i] = { ...photos[i], url: e.target.value };
                              updateBlock(selectedBlock.id, { photos });
                            }}
                          />
                          <button className="thumb-action-btn danger" onClick={() => {
                            const photos = (selectedBlock.photos || []).filter((_, j) => j !== i);
                            updateBlock(selectedBlock.id, { photos });
                          }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                    <button className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => handleUploadRequest(selectedBlock.id, 'carousel')}>
                      <Upload size={14} /> Add Photo
                    </button>
                  </>
                )}

                <div style={{ paddingTop: '0.5rem' }}>
                  <button
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '6px', color: '#ff4757', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    onClick={() => deleteBlock(selectedBlock.id)}
                  >
                    <Trash2 size={14} /> Delete Block
                  </button>
                </div>
              </>
            )}

            {rightTab === 'block' && !selectedBlock && (
              <p style={{ opacity: 0.4, fontSize: '0.85rem' }}>Click a block on the canvas to edit its properties.</p>
            )}

            {/* ── PAGES TAB ── */}
            {rightTab === 'pages' && (
              <>
                <div>
                  <div className="section-title">Pages</div>
                  <button className="btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={addPage}>
                    <Plus size={14} /> Add Page
                  </button>
                  <div className="page-list">
                    {pages.map(page => (
                      <div
                        key={page.id}
                        className={`page-item ${selectedPageId === page.id ? 'active' : ''}`}
                        onClick={() => { setSelectedPageId(page.id); setActiveSlideIdx(0); setSelectedBlockId(null); }}
                      >
                        <span>{page.title}</span>
                        <button
                          style={{ background: 'none', color: '#ff4757', opacity: 0.6, cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); deletePage(page.id); }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="section-title">Site Settings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Site Title</label>
                      <input type="text" value={siteSettings.title} onChange={e => setSiteSettings(s => ({ ...s, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Footer Text</label>
                      <input type="text" value={siteSettings.footerText} onChange={e => setSiteSettings(s => ({ ...s, footerText: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Typography</label>
                      <select value={siteSettings.typography} onChange={e => setSiteSettings(s => ({ ...s, typography: e.target.value }))}>
                        <option value="sans">Modern Sans</option>
                        <option value="serif">Elegant Serif</option>
                        <option value="mono">Technical Mono</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="section-title">Theme</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(themes).map(([key, theme]) => (
                      <div
                        key={key}
                        className={`theme-card-mini ${selectedTheme === key ? 'active' : ''}`}
                        onClick={() => setSelectedTheme(key)}
                      >
                        <div className="swatches">
                          <span style={{ background: theme.colors?.['--bg-primary'] || '#111' }} />
                          <span style={{ background: theme.colors?.['--accent'] || '#ff4757' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{theme.name || key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminEditor;
