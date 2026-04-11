import React, { useEffect, useState } from 'react';

import FormUsers from './components/users/formUsers/FormUsers';
import FormRoles from './components/roles/formRoles/FormRoles';
import TableUsers from './components/users/tableUsers/TableUsers';       
import TableRoles from './components/roles/tableRoles/TableRoles';       
import HttpService from '@services/HttpService';
import { errorAlert } from '@helpers/alerts';
import './Usuarios.scss';

const Usuarios = () => {
    const httpService = new HttpService();
    const [activeTab, setActiveTab] = useState('usuarios');

    // Users data
    const [usersData, setUsersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editData, setEditData] = useState({
        edit: false,
        userToEdit: null,
    });

    // Roles data
    const [rolesData, setRolesData] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [editDataRoles, setEditDataRoles] = useState({
        edit: false,
        roleToEdit: null,
    });

    useEffect(() => {
        getUsers();
        getRoles();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getUsers = async () => {
        try {
            setLoading(true);
            const response = await httpService.getData('/users');
            if (response.status === 200) {
                setUsersData(response.data || []);
            } else {
                errorAlert('Error', 'No se pudo obtener la lista de usuarios');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            errorAlert('Error', 'No se pudo obtener la lista de usuarios');
        } finally {
            setLoading(false);
        }
    };

    const getRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await httpService.getData('/roles');
            if (response.status === 200) {
                setRolesData(response.data || []);
            } else {
                errorAlert('Error', 'No se pudo obtener la lista de roles');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            errorAlert('Error', 'No se pudo obtener la lista de roles');
        } finally {
            setLoadingRoles(false);
        }
    }



    return (
        <div className="main_container">
            {/* Tabs de navegación */}
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === 'usuarios' ? 'active' : ''
                        }`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('usuarios');
                        }}
                    >
                        👤🔐 Usuarios & Roles
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === 'crear' ? 'active' : ''
                        }`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('crear');
                        }}
                    >
                        {editData.edit ? '👥📝 Editar Usuario' : '👤➕ Crear Usuario'}
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === 'crear_rol' ? 'active' : ''
                        }`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('crear_rol');
                        }}
                    >
                        {editDataRoles.edit ? '👥📝 Editar Rol' : '🔐➕ Crear Rol'}
                    </a>
                </li>
            </ul>

            {/* Contenido de cada tab */}
            <div className="tab-content mt-3">
                {activeTab === 'usuarios' && (
                    <div className="tab-pane fade show active">
                        <h1 className="text-center mt-4 pt-4">Usuarios</h1>
                        <h4 className="text-center mb-4">Lista de Usuarios</h4>
                        <TableUsers
                            usersData={usersData}
                            getUsers={getUsers}
                            loading={loading}
                            setLoading={setLoading}
                            handleTabChange={handleTabChange}
                            setEditData={setEditData}
                            setEditDataRoles={setEditDataRoles}
                        />
                        

                        <h1 className="text-center mt-4 pt-4">Roles</h1>
                        <h4 className="text-center mb-4">Lista de Roles</h4>
                        <TableRoles
                            rolesData={rolesData}
                            getRoles={getRoles}
                            loading={loadingRoles}
                            setLoading={setLoadingRoles}
                            handleTabChange={handleTabChange}
                            setEditData={setEditDataRoles}
                        />


                    </div>
                )}
                {activeTab === 'crear' && (
                    <div className="tab-pane fade show active">
                        <FormUsers 
                            handleTabChange={handleTabChange} 
                            editData={editData}
                            setEditData={setEditData}
                            setEditDataRoles={setEditDataRoles}
                        />
                    </div>
                )}
                {activeTab === 'crear_rol' && (
                    <div className="tab-pane fade show active">
                        <FormRoles 
                            setEditDataUser={setEditData}
                            setEditDataRoles={setEditDataRoles}
                            editDataRoles={editDataRoles}
                            handleTabChange={handleTabChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Usuarios;
