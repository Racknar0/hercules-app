"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar as Sidenav, Menu, MenuItem } from 'react-pro-sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon } from '@admin-shared/icons/ChartIcon';
import { ProductIcon } from '@admin-shared/icons/ProductIcon';
import { UserAddIcon } from '@admin-shared/icons/UserIcon';
import { CouponIcon } from '@admin-shared/icons/CouponIcon';
import { ReciboIcon } from '@admin-shared/icons/ReciboIcon';
import { CorteIcon } from '@admin-shared/icons/CorteIcon';
import { SellIcon } from '@admin-shared/icons/SellIcon';
import { ApartadoIcon } from '@admin-shared/icons/ApartadoIcon';
import { CambioIcon } from '@admin-shared/icons/CambioIcon';
import { ChevronLeftIcon } from '@admin-shared/icons/ChevronLeftIcon';
import { BarcodeIcon } from '@admin-shared/icons/BarcodeIcon';
import logoLogin from '@assets/logo-login.png';
import useStore from '@store/useStore';
import { getAssetSrc } from '@helpers/assetSrc';
import './Sidebar.scss';
import HttpService from '@services/HttpService';
import { InventarioIcon } from '@admin-shared/icons/InventarioIcon';

const width = '290px';
const colapsedWidth = '70px';
const backgroundColor = '#4932a5';
const transitionDuration = 500;

// Configuración del menú: cada clave es la etiqueta, y el valor es un objeto con la ruta, el icono y los roles permitidos.
const menuConfig = {
    Dashboard: {
        roles: ['2'],
        path: '/dashboard/reportes',
        icon: <ChartIcon width={40} height={40} />,
    },
    Ventas: {
        roles: ['1'],
        path: '/dashboard/ventas',
        icon: <SellIcon width={40} height={40} />,
    },

    Productos: {
        roles: ['1', '2'],
        path: '/dashboard/productos',
        icon: <ProductIcon width={40} height={40} />,
    },
    Store: {
        roles: ['2'],
        path: '/dashboard/store',
        icon: <ProductIcon width={40} height={40} />,
    },
    Stock: {
        roles: ['1', '2', '3'],
        path: '/dashboard/stock',
        icon: <InventarioIcon width={40} height={40} />,
    },
    Movimientos: {
        roles: ['1', '2', '3'],
        path: '/dashboard/movimientos',
        icon: <InventarioIcon width={40} height={40} />,
    },
    Usuarios: {
        roles: ['2'],
        path: '/dashboard/usuarios',
        icon: <UserAddIcon width={40} height={40} />,
    },
    Cupones: {
        roles: ['2'],
        path: '/dashboard/cupones',
        icon: <CouponIcon width={40} height={40} />,
    },
    Recibos: {
        roles: ['1', '2'],
        path: '/dashboard/recibos',
        icon: <ReciboIcon width={40} height={40} />,
    },
    Cortes: {
        roles: ['1'],
        path: '/dashboard/cortes',
        icon: <CorteIcon width={40} height={40} />,
    },
    ListadoCortes: {
        roles: ['1', '2'],
        path: '/dashboard/listado-cortes',
        icon: <CorteIcon width={40} height={40} />,
    },
    'Códigos de Barras': {
        roles: ['1', '2'],
        path: '/dashboard/codigos-barras',
        icon: <BarcodeIcon width={40} height={40} />,
    },
    // Apartados: {
    //     roles: ['1'],
    //     path: '/dashboard/apartados',
    //     icon: <ApartadoIcon width={40} height={40} />,
    // },
    // 'Cambio Tienda': {
    //     roles: ['1'],
    //     path: '/dashboard/cambio-tienda',
    //     icon: <CambioIcon width={40} height={40} />,
    // },
};

const Sidebar = ({ toggled, setToggled, setBroken }) => {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const jwtData = useStore((state) => state.jwtData);
    const selectedStore = useStore((state) => state.selectedStore);
    const setSelectedStore = useStore((state) => state.setSelectedStore);

    // Convierte el roleId a cadena para comparar
    const currentRole = jwtData?.roleId ? String(jwtData.roleId) : null;

    // Filtra el objeto de configuración para los ítems permitidos para el rol actual
    const filteredMenuItems = Object.entries(menuConfig).filter(
        ([label, config]) => {
            return currentRole && config.roles.includes(currentRole);
        }
    );

    const [tienda, setTienda] = useState('');
    const [tiendas, setTiendas] = useState([]);
    const httpService = new HttpService();

    useEffect(() => {
        if (jwtData?.roleId !== 2) return;

        const getTiendas = async () => {
            try {
                const response = await httpService.getData('/stores');
                const tiendasData = response.data;
                setTiendas(tiendasData);
            } catch (error) {
                console.error('Error fetching tiendas:', error);
            }
        };

        getTiendas();
    }, [jwtData?.roleId]);

    useEffect(() => {
        if (!selectedStore && jwtData?.storeLogin) {
            setSelectedStore(jwtData.storeLogin);
        }
    }, [jwtData?.storeLogin, selectedStore, setSelectedStore]);

    return (
        <Sidenav
            width={width}
            collapsedWidth={colapsedWidth}
            collapsed={collapsed}
            backgroundColor={backgroundColor}
            toggled={toggled}
            customBreakPoint="992px"
            onBreakPoint={setBroken}
            onBackdropClick={() => setToggled(false)}
            transitionDuration={transitionDuration}
        >
            <Menu
                menuItemStyles={{
                    root: ({ level, active }) => ({
                        marginBottom: '0.5rem',
                        marginTop: '0.5rem',
                    }),
                    button: ({ level, active, disabled }) => {
                        if (level === 0)
                            return {
                                color: active ? '#000' : '#fff',
                                backgroundColor: active ? '#f3f3f3' : undefined,
                                fontWeight: active ? 'bold' : undefined,
                                fontFamily: 'var(--font-poppins)',
                                fontSize: '1.65rem',
                                '&:hover': {
                                    backgroundColor: active
                                        ? '#f3f3f3'
                                        : '#3f2a90',
                                    color: active ? '#000' : '#fff',
                                },
                            };
                    },
                }}
            >
                {jwtData?.roleId === 2 && (
                    <div className="sidebar_header">
                        <div className="input_group">
                            <select
                                className="form-control input_group"
                                id="tienda"
                                required
                                value={selectedStore || ""}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                <option value="" disabled>
                                    Seleccionar tienda
                                </option>
                                {tiendas.map((tienda) => (
                                    <option key={tienda.id} value={tienda.id}>
                                        {tienda.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {filteredMenuItems.map(([label, config]) => (
                    <MenuItem
                        key={label}
                        icon={config.icon}
                        active={pathname === config.path}
                        component={<Link href={config.path} />}
                    >
                        {label}
                    </MenuItem>
                ))}

                <div className="sidebar_footer">
                    <div className="sidebar_footer_logo_container">
                        <img
                            className="sidebar_footer_logo"
                            src={getAssetSrc(logoLogin)}
                            alt="Logo de la empresa"
                        />
                    </div>
                    <p
                        className="sidebar_footer_text"
                        style={{
                            fontSize: collapsed ? '0.5rem' : '1.2rem',
                            transition: 'font-size 0.3s ease',
                        }}
                    >
                        © 2025 Todos los derechos reservados
                    </p>
                </div>

                <button
                    className="collapse_btn"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeftIcon
                        width={30}
                        height={30}
                        style={{
                            transform: collapsed
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                        }}
                    />
                </button>
            </Menu>
        </Sidenav>
    );
};

export default Sidebar;
