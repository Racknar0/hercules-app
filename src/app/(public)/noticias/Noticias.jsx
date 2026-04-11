'use client';

import { useState } from 'react';
import { NOTICIAS, CATEGORY_COLORS } from './data/noticias';
import NoticiaModal from './components/NoticiaModal/NoticiaModal';
import './Noticias.scss';

const Noticias = () => {
  const [selected, setSelected] = useState(null);

  return (
    <section className="news">
      <div className="news__hero">
        <p className="news__eyebrow">Blog & Noticias</p>
        <h1 className="news__title">Últimas Noticias</h1>
        <p className="news__subtitle">
          Consejos, novedades y todo lo que necesitas saber sobre el mundo pet.
        </p>
      </div>

      <div className="news__container">
        {/* Featured (first article) */}
        <div className="news__featured" onClick={() => setSelected(NOTICIAS[0])}>
          <div className="news__featured-img">📷 Imagen destacada</div>
          <div className="news__featured-content">
            <span
              className="news__tag"
              style={{ background: CATEGORY_COLORS[NOTICIAS[0].category] || '#999' }}
            >
              {NOTICIAS[0].category}
            </span>
            <h2 className="news__featured-title">{NOTICIAS[0].title}</h2>
            <p className="news__featured-excerpt">{NOTICIAS[0].excerpt}</p>
            <div className="news__featured-meta">
              <span>{NOTICIAS[0].date}</span>
              <span>⏱ {NOTICIAS[0].readTime}</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="news__grid">
          {NOTICIAS.slice(1).map((n) => (
            <div className="news__card" key={n.id} onClick={() => setSelected(n)}>
              <div className="news__card-img">📷</div>
              <div className="news__card-body">
                <span
                  className="news__tag news__tag--sm"
                  style={{ background: CATEGORY_COLORS[n.category] || '#999' }}
                >
                  {n.category}
                </span>
                <h3 className="news__card-title">{n.title}</h3>
                <p className="news__card-excerpt">{n.excerpt}</p>
                <div className="news__card-meta">
                  <span>{n.date}</span>
                  <span>⏱ {n.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <NoticiaModal noticia={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
};

export default Noticias;
