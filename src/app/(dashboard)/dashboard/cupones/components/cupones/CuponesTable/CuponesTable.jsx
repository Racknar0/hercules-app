import React, { useEffect } from 'react';
import './CuponesTable.scss';
import { DeleteIcon } from '@admin-shared/icons/DeleteIcon';
import Spinner from '@admin-shared/spinner/Spinner';
import {
  confirmAlert,
  errorAlert,
  successAlert,
} from '@helpers/alerts';
import HttpService from '@services/HttpService';

const TableCupones = ({
  loading,
  setLoading,
  cuponesData = [],
  getCupones,
}) => {
  const httpService = new HttpService();

  // Al montar, asegurarnos de tener los datos
  useEffect(() => {
    getCupones();
  }, []);

  const handleDeleteCupon = async (cuponId) => {
    const confirmDelete = await confirmAlert(
      '¿Está seguro que desea eliminar este cupón?',
      'Esta acción no se puede deshacer.',
      'warning'
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await httpService.deleteData('/coupons', cuponId);
      if (response.status === 200) {
        successAlert('Cupón eliminado', 'El cupón ha sido eliminado exitosamente.');
        getCupones();
      } else {
        errorAlert('Error', 'No se pudo eliminar el cupón');
      }
    } catch (err) {
      console.error('Error deleting cupon:', err);
      errorAlert('Error', 'No se pudo eliminar el cupón');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table_container">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <th>Acciones</th>
            <th>% Descuento</th>
            <th>Código</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {!loading && cuponesData.length > 0 && cuponesData.map((c) => (
            <tr key={c.id}>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteCupon(c.id)}
                >
                  <DeleteIcon width={20} height={20} fill="#fff" />
                </button>
              </td>
              <td>{c.discount}%</td>
              <td>{c.code}</td>
              <td>{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="spinner_container">
          <Spinner color="#6564d8" />
        </div>
      )}
      {!loading && cuponesData.length === 0 && (
        <p className="text-center">No hay cupones disponibles.</p>
      )}
    </div>
  );
};

export default TableCupones;
