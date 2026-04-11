"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '@admin-shared/Sidebar/Sidebar';
import './Layout.scss'; 
import { confirmAlert } from '@helpers/alerts';
import { CollapseIcon } from '@admin-shared/icons/CollapseIcon';
import userImage from '@assets/user.png'; // Importa la imagen del usuario desde la carpeta de assets
import { getAssetSrc } from '@helpers/assetSrc';
import useStore from '@store/useStore';
import { useRouter } from 'next/navigation';

const Layout = ({ children }) => {

  const [mounted, setMounted] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [broken, setBroken] = useState(false); // Estado para manejar el colapso del sidenav en pantallas pequeñas
  const router = useRouter();
  const token = useStore((state) => state.token);
  const jwtData = useStore((state) => state.jwtData);
  const logout = useStore((state) => state.logout);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setBroken(window.matchMedia('(max-width: 768px)').matches);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      router.replace('/login');
    }
  }, [mounted, token, router]);

  if (!mounted || !token || !jwtData) {
    return null;
  }


    const handleLogout = async () => {

        const confirmLogout = await confirmAlert(
          '¿Está seguro que desea cerrar sesión?',
          'Al cerrar sesión, se cerrará su sesión actual.',
          'warning'
        );

        if (!confirmLogout) return; // Si el usuario cancela, no hacemos nada

        await logout(); // Limpia store, localStorage y cookie de auth
        router.replace('/login');
        
    };

  return (
    <div className='container_layout'>
      <header className="header">

        <div className='header_title_container'>
          <h1 className='header_title'>
            {
              jwtData?.store?.name ? jwtData.store.name : jwtData?.roleId === 2 ? 'Administrador' : 'Tienda no disponible'
            }
          </h1>
        </div>

        <div className='header_right_container'>
          <div className="header_user_container">
                  <div className='image_logouser_container'>
                      <img className='image_logouser' src={
                        jwtData?.userImage ? `${process.env.NEXT_PUBLIC_BACK_HOST}/${jwtData.userImage}` : getAssetSrc(userImage)
                      } alt="Logo de usuario" />
                  </div>
                  <div className='user_info_container'>
                      <div className='user_name_container'>
                          <p className='user_name'>
                            {jwtData?.username || 'Usuario no disponible'}
                          </p>
                      </div>
                      <div className='user_role_container'>
                          <p className='user_role'>
                            {
                              jwtData?.role || 'Rol no disponible'
                            }
                          </p>
                      </div>
                  </div>
            </div>
          <button className="logout_btn" onClick={handleLogout}> Desconectar </button>
          {broken && ( 
            <button 
              className="bnt_toggle" 
              onClick={() => setToggled(!toggled)} 
              style={{ transform: toggled ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
            > 
              <CollapseIcon 
                className="collapse_icon" 
                width={30} 
                height={30} 
              /> 
            </button> 
          )}
          
        </div>
      </header>

      <div className='main_wrapper'>
        <Sidebar
          toggled={toggled}
          setToggled={setToggled}
          broken={broken}
          setBroken={setBroken}
        />

        {/* Contenido dinámico basado en las rutas */}
        <div className="main_content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
