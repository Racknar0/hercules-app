import React, { useEffect, useState } from 'react'
import './FormCupones.scss';
import { confirmAlert, errorAlert, successAlert } from '@helpers/alerts';
import HttpService from '@services/HttpService';
import Spinner from '@admin-shared/spinner/Spinner';

const FormCupones = () => {

  const httpService = new HttpService();
  
  const [loading, setLoading] = useState(false);

  const [cuponCode, setCuponCode] = useState('');
  const [cuponDescription, setCuponDescription] = useState('');
  const [cuponDiscount, setCuponDiscount] = useState('');


  const HandleSubmit = async (e) => {

    e.preventDefault();

    // Validar el formulario
    if (!cuponCode || !cuponDescription || !cuponDiscount) {
      errorAlert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    
    const confirm = await confirmAlert(
                'Confirmar acción',
                `¿Está seguro de que desea crear el cupón?`,
                'warning'
            );
    if (!confirm) return;


    const data = {
      code: cuponCode,
      description: cuponDescription,
      discount: cuponDiscount,
    };

    await postData(data);
  }

  const postData = async (data) => {

    

    try {
      setLoading(true);
      const response = await httpService.postData('/coupons', data);
      if (response.status === 201) {
        successAlert('Éxito', 'Cupón creado exitosamente');
        setCuponCode('');
        setCuponDescription('');
        setCuponDiscount('');
      } else {
        errorAlert('Error', 'No se pudo crear el cupónx');
      }
    } catch (error) { 
      // console.error('Error al crear el cupón:', error);
      // errorAlert('Error', 'No se pudo crear el cupónxx');
      const msg = error.response?.data?.error || 'Error al crear el cupón';
      errorAlert('Error', msg);

    } finally {
      setLoading(false);
    }
  }

  


  return (
    <div className="form_main_container">
      <h2 className="form_title text-center">Crear Cupón</h2>
        <form>
              <div className="mb-3">
                <label htmlFor="cuponCode" className="form-label">
                  Código del Cupón
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cuponCode"
                  value={cuponCode}
                  onChange={(e) => setCuponCode(e.target.value)}
                  placeholder="Ingrese el código del cupón"
                />
              </div>
            
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Descripción del Cupón
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="description"
                  value={cuponDescription}
                  onChange={(e) => setCuponDescription(e.target.value)}
                  placeholder="Ingrese la descripción del cupón"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="discount" className="form-label">
                  Descuento del Cupón
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="discount"
                  value={cuponDiscount}
                  onChange={(e) => setCuponDiscount(e.target.value)}
                  placeholder="Ingrese el descuento del cupón"
                />
              </div>
              {
                !loading ? (
                  <button type="submit" className="btn_submit" disabled={loading} onClick={HandleSubmit}>
                    Crear Cupón
                  </button>
                ) : (
                  <div className="d-flex justify-content-center align-items-center mt-4">
                    <Spinner color="#6564d8" />
                  </div>
                )
              }
            </form>
    </div>
  )
}

export default FormCupones