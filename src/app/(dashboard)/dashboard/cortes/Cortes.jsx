import React, { useEffect, useState } from 'react';
import './Cortes.scss';
import HttpService from '@services/HttpService';
import { confirmAlert, errorAlert, successAlert } from '@helpers/alerts';
import useStore from '@store/useStore';

const Cortes = () => {
    const httpService   = new HttpService();
    const selectedStore = useStore(state => state.selectedStore);
  
    const [data, setData]             = useState({});
    const [comentarios, setComentarios] = useState('');
  
    // 1) Carga inicial del resumen
    useEffect(() => {
      getDetails();
    }, [selectedStore]);
  
    const getDetails = async () => {
      try {
        const res = await httpService.getData(`/cortes/summary?storeId=${selectedStore}`);
        if (res.status === 200) {
          setData(res.data);
        } else {
          throw new Error();
        }
      } catch {
        errorAlert('Error', 'Error al obtener los datos del corte');
      }
    };
  
    // 2) Borra el corte de hoy (para retry en caso de 409)
    const deleteCorte = async () => {
      try {
        await httpService.deleteDataWithBody('/cortes', { storeId: String(selectedStore) });
        return true;
      } catch {
        errorAlert('Error', 'No se pudo eliminar el corte existente');
        return false;
      }
    };
  
    // 3) Crea el corte (POST)
    const postCorte = async () => {
      return httpService.postData('/cortes', {
        storeId:     String(selectedStore),
        comentarios
      });
    };
  
    // 4) Handler del botón Guardar
    const handleSave = async () => {

      const BACK_HOST = process.env.NEXT_PUBLIC_BACK_HOST;

      try {

        const confirm = await confirmAlert('¿Estás seguro?', '¿Deseas guardar el corte?');
        if (!confirm) return;

        const res = await postCorte();
        if (res.status === 201) {
          successAlert('Éxito', 'Corte guardado correctamente');
          getDetails();

          // Limpiar comentarios
          setComentarios('');
          // Abrir la url del pdf del corte
          const pdfUrl = `${BACK_HOST}/cortes/generate-pdf/${res.data.id}`;
          window.open(pdfUrl, '_blank');

        } else {
          throw new Error();
        }
  
      } catch (err) {
        // Si vino 409, borramos y volvemos a intentar
        if (err.response?.status === 409) {
          const confirm = await confirmAlert('Ya existe un corte hoy. ¿Deseas reemplazarlo?');
          if (!confirm) return;
  
          const deleted = await deleteCorte();
          if (deleted) {
            // reintentar crear
            try {
              const retry = await postCorte();
              if (retry.status === 201) {
                successAlert('Éxito', 'Corte reemplazado correctamente');
                getDetails();

                // Limpiar comentarios
                setComentarios('');
                // Abrir la url del pdf del corte
                const pdfUrl = `${BACK_HOST}/cortes/generate-pdf/${retry.data.id}`;
                window.open(pdfUrl, '_blank');
              } else {
                throw new Error();
              }
            } catch {
              errorAlert('Error', 'No se pudo recrear el corte');
            }
          }
        } else {
          errorAlert('Error', 'No se pudo guardar el corte');
        }
      }
    };

    return (
        <div className="cortes_container">
            <h1>Cortes</h1>

            <div className="cortes_content">
                <div className="cortes_content_item">
                    <h2>Fecha</h2>
                    <p>{data.date ? data.date : 'No hay fecha'}</p>
                </div>

                <div className="cortes_content_item">
                    <h2>Folio Inicial</h2>
                    <p>
                        {data.folioInicial
                            ? data.folioInicial
                            : 'No hay folio inicial'}
                    </p>
                </div>

                <div className="cortes_content_item">
                    <h2>Folio Final</h2>
                    <p>
                        {data.folioFinal
                            ? data.folioFinal
                            : 'No hay folio final'}
                    </p>
                </div>

                <div className="cortes_content_item">
                    <h2>Costo Total</h2>
                    <p>
                        {data.costoTotal
                            ? data.costoTotal
                            : 'No hay costo total'}
                    </p>
                </div>

                <div className="cortes_content_item">
                    <h2>Venta Total</h2>
                    <p>
                        {data.ventaTotal
                            ? `$ ${data.ventaTotal}`
                            : 'No hay venta total'}
                    </p>
                </div>

                <div className="cortes_content_item">
                    <h2>Efectivo</h2>
                    <p>{data.efectivo ? `$ ${data.efectivo}` : '$ 0'}</p>
                </div>

                <div className="cortes_content_item">
                    <h2>Tarjeta</h2>
                    <p>{data.tarjeta ? `$ ${data.tarjeta}` : '$ 0'}</p>
                </div>

                <div className="cortes_content_item">
                    <h2>Transferencia</h2>
                    <p>
                        {data.transferencia ? `$ ${data.transferencia}` : '$ 0'}
                    </p>
                </div>

                <div className="cortes_content_item">
                    <h2>Ingreso Cambios</h2>
                    <p>{data.ingresoInterno ? `$ ${data.ingresoInterno}` : '$ 0'}</p>
                </div>

                <div className="cortes_content_item">
                    <h2>Ingreso Total</h2>
                    <p>
                        {data.ingresoTotal
                            ? `$ ${data.ingresoTotal}`
                            : 'No hay ingreso total'}
                    </p>
                </div>

                
            </div>

                <div className="cortes_content_item_comments">
                    <h2>Comentarios Adicionales</h2>
                    <textarea
                        placeholder="Comentarios Adicionales"
                        rows="5"
                        value={comentarios}
                        onChange={e => setComentarios(e.target.value)}
                    ></textarea>
                </div>

            <div className={`cortes_buttons ${data.folioFinal ? '' : 'disabled'}`} onClick={handleSave}>
                <button>Guardar</button>
            </div>
        </div>
    );
};

export default Cortes;
