'use client';

import './NoticiaModal.scss';

const NoticiaModal = ({ noticia, onClose }) => {
  if (!noticia) return null;

  return (
    <>
      <div className="nm__overlay" onClick={onClose} />
      <div className="nm">
        <button className="nm__close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="nm__image">
          <span className="nm__image-placeholder">📷 Imagen de noticia</span>
        </div>

        <div className="nm__body">
          <div className="nm__meta">
            <span className="nm__date">{noticia.date}</span>
            <span className="nm__read-time">⏱ {noticia.readTime}</span>
          </div>

          <h2 className="nm__title">{noticia.title}</h2>

          <div className="nm__content">
            {noticia.content.split('\n\n').map((paragraph, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default NoticiaModal;
