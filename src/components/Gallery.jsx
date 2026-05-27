import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Gallery.css';

const Gallery = ({ photos, pageTitle, bio, layout = 'grid', isBlock = false }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextPhoto = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className={`gallery-container fade-in layout-${layout}`}>
      {!isBlock && (
        <header className="gallery-header">
          <h2 className="gallery-title">{pageTitle}</h2>
          {bio && <p className="gallery-bio">{bio}</p>}
        </header>
      )}

      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={photo.id} className="photo-card" onClick={() => openLightbox(index)}>
            <img src={photo.url} alt={photo.caption || "Photography"} loading="lazy" />
            <div className="photo-overlay">
              <span>{photo.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox glass fade-in" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}><X size={32} /></button>
          <button className="lightbox-nav prev" onClick={prevPhoto}><ChevronLeft size={48} /></button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightboxIndex].url} alt={photos[lightboxIndex].caption} />
            {photos[lightboxIndex].caption && (
              <p className="lightbox-caption">{photos[lightboxIndex].caption}</p>
            )}
          </div>
          
          <button className="lightbox-nav next" onClick={nextPhoto}><ChevronRight size={48} /></button>
        </div>
      )}
    </div>
  );
};

export default Gallery;
