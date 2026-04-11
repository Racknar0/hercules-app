import React, { useEffect, useState } from 'react';
import HttpService from '@services/HttpService';
import { confirmAlert, errorAlert, successAlert } from '@helpers/alerts';

import './FormUser.scss';
import Spinner from '@admin-shared/spinner/Spinner';

const FormUsers = ({
    handleTabChange,
    editData,
    setEditData,
    setEditDataRoles,
}) => {

    const httpService = new HttpService();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        lastName: '',
        email: '',
        roleId: '',
        storeId: '',
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [stores, setStores] = useState([]);

    // Si editData tiene datos, se cargan en el formulario
    useEffect(() => {
        if (editData.edit && editData.userToEdit) {
            const storeId = editData.userToEdit.storeId || null; // Si no hay storeId, se asigna null

            const { user, name, lastName, email, roleId } = editData.userToEdit;

            setFormData({
                username: user || '',
                password: '', // No se puede editar la contraseña desde aquí
                name: name || '',
                lastName: lastName || '',
                email: email || '',
                roleId: roleId || '',
                storeId: storeId || '',
            });
        }
    }, [editData]);

    useEffect(() => {
        setEditDataRoles({
            edit: false,
            roleToEdit: null,
        });
    }, []);

    // Obtener los roles disponibles al cargar el componente
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await httpService.getData('/roles');
                if (response.status === 200) {
                    setRoles(response.data);
                } else {
                    errorAlert(
                        'Error',
                        'No se pudieron cargar los roles. Por favor, inténtelo de nuevo.'
                    );
                }
            } catch (error) {
                console.error('Error fetching roles:', error);
                errorAlert(
                    'Error',
                    'No se pudieron cargar los roles. Por favor, inténtelo de nuevo.'
                );
            }
        };
        fetchRoles();
    }, []);


    useEffect(() => {
      const fetchStores = async () => {
        try {
          const response = await httpService.getData('/stores');
          if (response.status === 200) {  
            setStores(response.data);
          } else {
            errorAlert(
              'Error',
              'No se pudieron cargar las tiendas. Por favor, inténtelo de nuevo.'
            );
          }
        } catch (error) {
          console.error('Error fetching stores:', error);
          errorAlert(
            'Error',
            'No se pudieron cargar las tiendas. Por favor, inténtelo de nuevo.'
          );
        }
      };
      fetchStores();
    }, []);



    // Maneja cambios en los inputs de texto
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    // Maneja el input de tipo file para la imagen
    const handleFileChange = (e) => {
        setProfilePicture(e.target.files[0]);
    };

    // Función para enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Crear un FormData para enviar datos con multipart/form-data
        const data = new FormData();
        data.append('username', formData.username);
        data.append('password', formData.password);
        data.append('name', formData.name);
        data.append('lastName', formData.lastName);
        data.append('storeId', formData.storeId);
        if (formData.email) data.append('email', formData.email);
        if (formData.roleId) data.append('roleId', formData.roleId);
        if (profilePicture) data.append('profilePicture', profilePicture);

        // Validaciones
        if (
            !formData.username ||
            (!formData.password && !editData.edit) ||
            !formData.name ||
            !formData.lastName ||
            !formData.roleId
        ) {
            errorAlert(
                'Error',
                'Por favor, complete todos los campos obligatorios: usuario, contraseña, nombre, apellido y rol.'
            );
            setLoading(false);
            return;
        }

        console.log('formData', formData);

        if (formData.roleId !== 2 && !formData.storeId) {
            errorAlert( 
                'Error',
                'Por favor, seleccione una tienda.'
            );
            setLoading(false);
            return;
        }

        // Validar que venga un archivo de imagen
        if (!profilePicture && !editData.edit) {
            errorAlert('Error', 'Por favor, seleccione una imagen de perfil.');
            setLoading(false);
            return;
        }

            const confirm = await confirmAlert(
                        'Confirmar acción',
                        `¿Está seguro de que desea ${editData.edit ? 'actualizar' : 'crear'} el usuario ${formData.username}?`,
                        'warning'
                    );
            if (!confirm) return;

        if (editData.edit && editData.userToEdit) {
            // Si estamos editando un usuario, llamamos a la función de actualización
            updateUser(data);
        } else {
            // Si estamos creando un nuevo usuario, llamamos a la función de creación
            createUser(data);
        }
    };

    const createUser = async (data) => {
        try {
            setLoading(true);
            const response = await httpService.postFormData('/users', data);

            if (response.status !== 201) {
                errorAlert(
                    'Error',
                    'No se pudo crear el usuario. Por favor, inténtelo de nuevo.'
                );
                console.error('Error:', response);
            } else {
                console.log('Response:', response);
                const newUser = response.data;
                successAlert(
                    'Usuario creado',
                    `El usuario ${newUser.user} ha sido creado exitosamente.`
                );
                // // Reiniciar el formulario
                setFormData({
                    username: '',
                    password: '',
                    name: '',
                    lastName: '',
                    email: '',
                    roleId: '',
                    storeId: '',
                });
                setProfilePicture(null);
                // Cambiar de pestaña a usuarios
                handleTabChange('usuarios');
            }
        } catch (error) {
            const { response } = error;
            errorAlert(
                'Error',
                `${
                    response.data.message ||
                    'No se pudo crear el usuario. Por favor, inténtelo de nuevo.'
                }`
            );
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (data) => {
        try {
            setLoading(true);
            const response = await httpService.putFormData(
                '/users',
                editData.userToEdit.id,
                data
            );

            if (response.status !== 200) {
                errorAlert(
                    'Error',
                    'No se pudo actualizar el usuario. Por favor, inténtelo de nuevo.'
                );
                console.error('Error:', response);
            } else {
                console.log('Response:', response);
                const updatedUser = response.data;
                successAlert(
                    'Usuario actualizado',
                    `El usuario ${updatedUser.user} ha sido actualizado exitosamente.`
                );
                // Reiniciar el formulario
                setFormData({
                    username: '',
                    password: '',
                    name: '',
                    lastName: '',
                    email: '',
                    roleId: '',
                });
                setProfilePicture(null);
                // Cambiar de pestaña a usuarios
                handleTabChange('usuarios');
                // Reiniciar el estado de edición
                setEditData({
                    edit: false,
                    userToEdit: null,
                });
            }
        } catch (error) {
            const { response } = error;
            errorAlert(
                'Error',
                `${
                    response.data.message ||
                    'No se pudo actualizar el usuario. Por favor, inténtelo de nuevo.'
                }`
            );
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form_main_container">
            <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                        Usuario
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="username"
                        placeholder="nombre de usuario"
                        value={formData.username}
                        onChange={handleChange}
                    />
                </div>
                {/* Password */}
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                        Contraseña
                    </label>
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        placeholder="contraseña"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>
                {/* Name */}
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                        Nombre
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        placeholder="nombre"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>
                {/* Last Name */}
                <div className="mb-3">
                    <label htmlFor="lastName" className="form-label">
                        Apellido
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        placeholder="apellido"
                        value={formData.lastName}
                        onChange={handleChange}
                    />
                </div>
                {/* Email (opcional) */}
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>
                {/* Role ID (opcional) */}
                {/* Role ID (opcional) */}
                <div className="mb-3">
                    <label htmlFor="roleId" className="form-label">
                        Seleccione un rol
                    </label>
                    <select
                        className="form-control"
                        id="roleId"
                        value={formData.roleId}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                roleId: parseInt(e.target.value, 10) || '',
                            }))
                        }
                    >
                        <option value="" disabled>
                            Seleccione un rol
                        </option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Store ID (opcional) */}
                <div className="mb-3">
                    <label htmlFor="storeId" className="form-label">
                        Seleccione una tienda 'Para los roles que no son ADM'
                    </label>  
                    <select
                        className="form-control"
                        id="storeId"
                        value={formData.storeId}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                storeId: parseInt(e.target.value, 10) || '',
                            }))
                        }
                    >
                        <option value="" disabled>
                            Seleccione una tienda
                        </option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </div>


                {/* Imagen de perfil */}
                <div className="mb-3">
                    <label htmlFor="profilePicture" className="form-label">
                        Profile Picture
                    </label>
                    {/* Vista previa de la imagen actual si estás en modo edición */}
                    {editData.edit && editData.userToEdit?.profilePicture && (
                        <div className="current-image-preview">
                            <img
                                src={
                                    process.env.NEXT_PUBLIC_BACK_HOST +
                                    '/' +
                                    editData.userToEdit.profilePicture
                                }
                                alt="Current Profile"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'cover',
                                }}
                            />
                        </div>
                    )}
                    <input
                        type="file"
                        className="form-control"
                        id="profilePicture"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                </div>
                {!loading && (
                    <button
                        type="submit"
                        className="btn_submit"
                        disabled={loading}
                    >
                        {editData.edit ? 'Actualizar Usuario' : 'Crear Usuario'}
                    </button>
                )}
                {loading && (
                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <Spinner color="#6564d8" />
                    </div>
                )}
            </form>
        </div>
    );
};

export default FormUsers;
