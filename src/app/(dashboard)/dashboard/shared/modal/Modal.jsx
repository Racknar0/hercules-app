// Modal.jsx
import React from 'react';
import './Modal.scss'; // Aquí puedes agregar estilos personalizados para el modal

const Modal = ({ show, onClose, title = 'Titulo Modal', children }) => {
  // Si no se debe mostrar, retorna null
  if (!show) return null;

  return (
    <>
      {/* Modal */}
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            {/* Opcional header con título y botón de cierre */}
            {title && (
              <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                ></button>
              </div>
            )}
            {/* Cuerpo del Modal: se renderiza el contenido que se le pase */}
            <div className="modal-body">
              {children}
            </div>
            {/* Footer opcional con botón de cierre */}
            
          </div>
        </div>
      </div>
      {/* Backdrop para el modal */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default Modal;
