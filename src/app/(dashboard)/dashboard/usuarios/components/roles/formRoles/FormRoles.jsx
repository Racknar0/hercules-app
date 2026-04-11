import React, { useEffect, useState } from 'react'
import './FormRoles.scss';
import { confirmAlert, errorAlert, successAlert } from '@helpers/alerts';
import HttpService from '@services/HttpService';
import Spinner from '@admin-shared/spinner/Spinner';

const FormRoles = ({
  setEditDataUser,
  setEditDataRoles,
  editDataRoles,
  handleTabChange
}) => {

  const httpService = new HttpService();
  
  useEffect(() => {
    setEditDataUser({
      edit: false,
      userToEdit: null,
    });
  }, []);

  useEffect(() => {
    if (editDataRoles.edit && editDataRoles.roleToEdit) {
      const { name } = editDataRoles.roleToEdit;
      setRoleName(name || '');
    }
  }, [editDataRoles]);

  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState('');

  const HandleSubmit = async (e) => {

    e.preventDefault();

    // Validar el formulario
    if (!roleName) {
      errorAlert('Error', 'El nombre del rol es obligatorio');
      return;
    }
    
    const confirm = await confirmAlert(
                'Confirmar acción',
                `¿Está seguro de que desea ${editDataRoles.edit ? 'actualizar' : 'crear'} el rol ${roleName}?`,
                'warning'
            );
    if (!confirm) return;

    if (editDataRoles.edit) {
      // Si estamos editando un rol existente, llamamos a la función de actualización
      await updateData();
    } else {
      // Si estamos creando un nuevo rol, llamamos a la función de creación
      await postData();
    }



  }

  const postData = async () => {
    try {
      setLoading(true);
      const response = await httpService.postData('/roles', { name: roleName });
      if (response.status !== 201) {
        errorAlert('Error', 'No se pudo crear el rol');
      } else {
        successAlert('Rol creado', `El rol ${roleName} ha sido creado exitosamente.`);
        // Reiniciar el formulario
        setRoleName('');
        setEditDataRoles({
          edit: false,
          roleToEdit: null,
        });

        // Cambiar a la pestaña de roles
        handleTabChange('usuarios');
      } 

    } catch (error) {
      const { response } = error;
        errorAlert('Error', `${response.data.message || 'No se pudo crear el rol. Por favor, inténtelo de nuevo.'}`);
        console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  

  const updateData = async () => {
    try {
      setLoading(true);
      const response = await httpService.putData('/roles', editDataRoles.roleToEdit.id, { name: roleName });
      if (response.status !== 200) {
        errorAlert('Error', 'No se pudo actualizar el rol');
      } else {
        successAlert('Rol actualizado', `El rol ${roleName} ha sido actualizado exitosamente.`);
        // Reiniciar el formulario
        setRoleName('');
        setEditDataRoles({
          edit: false,
          roleToEdit: null,
        });

        // Cambiar a la pestaña de roles
        handleTabChange('usuarios');
      } 
    }catch (error) {
      const { response } = error;
        errorAlert('Error', `${response.data.message || 'No se pudo actualizar el rol. Por favor, inténtelo de nuevo.'}`);
        console.error('Error:', error);
    } finally {
      setLoading(false);
    }

  }



  return (
    <div className="form_main_container">
        <form>
              <div className="mb-3">
                <label htmlFor="role_name" className="form-label">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="role_name"
                  placeholder="Administrador"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>
            
              {
                !loading ? (
                  <button type="submit" className="btn_submit" disabled={loading} onClick={HandleSubmit}>
                    {editDataRoles.edit ? 'Actualizar Rol' : 'Crear Rol'}
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

export default FormRoles