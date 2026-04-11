import React, { useEffect } from 'react';
import './TableCategories.scss';
import { DeleteIcon } from '@admin-shared/icons/DeleteIcon';
import { EditIcon } from '@admin-shared/icons/EditIcon';
import Spinner from '@admin-shared/spinner/Spinner';
import {
    confirmAlert,
    errorAlert,
    successAlert,
} from '@helpers/alerts';
import HttpService from '@services/HttpService';
import useStore from '@store/useStore';

const TableCategories = ({
    loadingCategories,
    setLoadingCategories,
    categoriesData = [],
    getCategories,
    handleTabChange,
    setEditDataCategories,
    setEditDataProduct,
}) => {
    const httpService = new HttpService();

    const role = useStore((state) => state.jwtData?.role);

    useEffect(() => {
        getCategories();
        setEditDataCategories({ edit: false, categorieToEdit: null });
        setEditDataProduct({ edit: false, productToEdit: null });
    }, []);

    const handleDeleteCategorie = async (id) => {
        const confirmDelete = await confirmAlert(
            '¿Está seguro que desea eliminar esta categoría?',
            'Esta acción no se puede deshacer.',
            'warning'
        );

        if (!confirmDelete) return;

        try {
            setLoadingCategories(true);
            const response = await httpService.deleteData('/category', id);
            if (response.status === 200) {
                successAlert(
                    'Categoria eliminada',
                    `La categoria ha sido eliminado exitosamente.`
                );
                getCategories();
            } else {
                errorAlert('Error', 'No se pudo eliminar la categoría');
            }
        } catch (error) {
            console.error('Error deleting categoría', error);
            errorAlert('Error', 'No se pudo eliminar la categoría');
        } finally {
            setLoadingCategories(false);
        }
    };

    return (
        <div className="table_container">
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        {['Admin', 'Moderador'].includes(role) && (
                            <th>Acciones</th>
                        )}

                        <th>Id</th>
                        <th>Nombre de categoría</th>
                        <th>Fecha de Creación</th>
                        <th>Fecha de Modificación</th>
                    </tr>
                </thead>
                <tbody>
                    {!loadingCategories &&
                        categoriesData &&
                        categoriesData.length > 0 &&
                        categoriesData.map((u, index) => (
                            <tr key={index}>
                                {['Admin', 'Moderador'].includes(role) && (
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary me-2"
                                            onClick={() => {
                                                handleTabChange(
                                                    'crear_categoria'
                                                );
                                                setEditDataCategories({
                                                    edit: true,
                                                    categorieToEdit: u,
                                                });
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
                                            onClick={() =>
                                                handleDeleteCategorie(u.id)
                                            }
                                        >
                                            <DeleteIcon
                                                width={20}
                                                height={20}
                                                fill="#fff"
                                            />
                                        </button>
                                    </td>
                                )}

                                <td>{u.id || 'No disponible'}</td>
                                <td>{u.name || 'No disponible'}</td>
                                <td>
                                    {u.createdAt.split('T')[0] ||
                                        'No disponible'}
                                </td>
                                <td>
                                    {u.updatedAt.split('T')[0] ||
                                        'No disponible'}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
            {loadingCategories && (
                <div className="spinner_container">
                    <Spinner color="#6564d8" />
                </div>
            )}
        </div>
    );
};

export default TableCategories;
