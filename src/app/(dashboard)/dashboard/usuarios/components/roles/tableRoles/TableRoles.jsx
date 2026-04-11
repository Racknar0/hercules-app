import React, { useEffect } from 'react';
import './TableRoles.scss';
import { DeleteIcon } from '@admin-shared/icons/DeleteIcon';
import { EditIcon } from '@admin-shared/icons/EditIcon';
import Spinner from '@admin-shared/spinner/Spinner';
import {
    confirmAlert,
    errorAlert,
    successAlert,
} from '@helpers/alerts';
import HttpService from '@services/HttpService';

const TableRoles = ({
    loading,
    setLoading,
    rolesData = [],
    getRoles,
    handleTabChange,
    setEditData
}) => {
    const httpService = new HttpService();

    useEffect(() => {
        getRoles();
        setEditData({
            edit: false,
            roleToEdit: null,
        });
    }, []);


    const handleDeleteRol = async (roleId) => {

        const confirmDelete = await confirmAlert(
            '¿Está seguro que desea eliminar este rol?',
            'Esta acción no se puede deshacer.',
            'warning'
        );

        if (!confirmDelete) return; // Si el usuario cancela, no hacemos nada

        try {
            setLoading(true);
            const response = await httpService.deleteData('/roles', roleId);
            if (response.status === 200) {
                successAlert(
                    'Rol eliminado',
                    `El rol ha sido eliminado exitosamente.`
                );
                getRoles(); // Actualiza la lista de usuarios después de eliminar
            } else {
                errorAlert('Error', 'No se pudo eliminar el usuario');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            errorAlert('Error', 'No se pudo eliminar el usuario');
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
                        <th>Id</th>
                        <th>Nombre del Rol</th>
                        <th>Fecha de Creación</th>
                        <th>Fecha de Modificación</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading &&
                        rolesData &&
                        rolesData.length > 0 &&
                        rolesData.map((u, index) => (
                            <tr key={index}>
                                <td>
                                    <button
                                        className="btn btn-sm btn-primary me-2"
                                        onClick={() => {
                                            handleTabChange('crear_rol');
                                            setEditData({
                                                edit: true,
                                                roleToEdit: u,
                                            })
                                        }}
                                    >
                                        <EditIcon
                                            width={20}
                                            height={20}
                                            fill="#fff"
                                        />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDeleteRol(u.id)}
                                    >
                                        <DeleteIcon
                                            width={20}
                                            height={20}
                                            fill="#fff"
                                        />
                                    </button>
                                </td>
                                <td>{u.id || 'No disponible'}</td>
                                <td>{u.name || 'No disponible'}</td>
                                <td>{u.createdAt.split('T')[0] || 'No disponible'}</td>
                                <td>{u.updatedAt.split('T')[0] || 'No disponible'}</td>
                            </tr>
                        ))}
                </tbody>
            </table>
            {loading && (
                <div className="spinner_container">
                    <Spinner color="#6564d8" />
                </div>
            )}
        </div>
    );
};

export default TableRoles;
