'use client';

import React, { useEffect, useState } from 'react';
import HttpService from '@services/HttpService';
import { errorAlert, timerAlert } from '@helpers/alerts';
import useStore from '@store/useStore';
import { useRouter } from 'next/navigation';
import logoLogin from '@assets/logo-login.png';
import Spinner from '@admin-shared/spinner/Spinner';
import { getAssetSrc } from '@helpers/assetSrc';
import './page.scss';

export default function Page() {
  const login = useStore((state) => state.login);
  const token = useStore((state) => state.token);
  const httpService = new HttpService();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tienda, setTienda] = useState('');
  const [loadingTiendas, setLoadingTiendas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    if (token) {
      router.replace('/dashboard/reportes');
    }
  }, [token, router]);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        setLoadingTiendas(true);
        const response = await httpService.getData('/stores');
        if (response.status === 200) {
          setTiendas(response.data);
        } else {
          console.error('Error:', response);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingTiendas(false);
      }
    };

    if (!token) {
      fetchTiendas();
    }
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      username,
      password,
      tienda,
    };

    if (!username || !password || !tienda) {
      errorAlert('Error', 'Por favor completa todos los campos', 2000);
      return;
    }

    handleLogin(data);
  };

  const handleLogin = async (data) => {
    try {
      setSubmitting(true);

      const response = await httpService.postData('/auth/login', data);

      if (response.status === 200) {
        const authToken = response.data.token;
        login(authToken);
        await timerAlert('Bienvenido', 'Acceso exitoso', 2000).then(() => {
          router.push('/dashboard/reportes');
        });
      } else {
        console.error('Error:', response);
      }
    } catch (error) {
      console.error('Error:', error);
      await errorAlert(
        'Error',
        `${error.response?.data?.message || 'Login failed'}`,
        2000
      ).then(() => {
        setUsername('');
        setPassword('');
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="main_container_login">
      <div className="container_login">
        <div className="left_block_login">
          <div className="left_block_login_container">
            <div className="left_block_brand">
              <img src={getAssetSrc(logoLogin)} alt="Logo" className="logo_login" />
              <h1 className="title_login">Losrones</h1>
            </div>

            <div className="left_block_greeting">
              <h2 className="greeting_login">Bienvenido</h2>
            </div>

            <div className="left_block_form">
              <form className="form_login" onSubmit={handleSubmit}>
                <div className="input_group">
                  <label htmlFor="username" className="label label_email">
                    Username
                  </label>
                  <input
                    type="text"
                    className="input_text"
                    id="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="input_group">
                  <label htmlFor="password" className="label label_pass">
                    Password
                  </label>
                  <div className="password_field_wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input_text input_text_password"
                      id="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password_toggle_btn"
                      aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M10.6 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M9.9 5.2C10.6 5.1 11.3 5 12 5C16.8 5 20.4 8.1 22 12C21.5 13.2 20.8 14.2 20 15.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M6.2 6.2C4.5 7.4 3.2 9.1 2 12C3.6 15.9 7.2 19 12 19C13.8 19 15.4 18.6 16.8 17.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M2 12C3.6 8.1 7.2 5 12 5C16.8 5 20.4 8.1 22 12C20.4 15.9 16.8 19 12 19C7.2 19 3.6 15.9 2 12Z" stroke="currentColor" strokeWidth="2" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="input_group">
                  <label htmlFor="tienda" className="label label_tienda">
                    Tienda
                  </label>
                  <select
                    className="input_select"
                    id="tienda"
                    required
                    value={tienda}
                    disabled={loadingTiendas}
                    onChange={(e) => setTienda(e.target.value)}
                  >
                    <option value="" disabled>
                      {loadingTiendas ? 'Cargando tiendas...' : 'Seleccionar tienda'}
                    </option>
                    {tiendas.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {submitting ? (
                  <div className="spinner_container">
                    <Spinner />
                  </div>
                ) : (
                  <button type="submit" className="login_submit_btn" disabled={loadingTiendas}>
                    Iniciar sesion
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="right_block_login">
          <div className="right_block_login_container">
            <img src={getAssetSrc(logoLogin)} alt="Logo" className="logo_login" />
          </div>
        </div>
      </div>
    </div>
  );
}
