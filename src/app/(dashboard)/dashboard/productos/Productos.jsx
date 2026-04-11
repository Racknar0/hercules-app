import React, { useEffect, useState } from 'react';
import HttpService from '@services/HttpService';
import { errorAlert } from '@helpers/alerts';
import './Productos.scss';
import FormCategorias from './components/categories/formCategories/FormCategorias';
import FormProduct from './components/products/formProduct/FormProduct'; 
import TableCategories from './components/categories/tableCategories/TableCategories';
import TableProduct from './components/products/tableProduct/TableProduct';
import useStore from '@store/useStore';

const Productos = () => {
    const httpService = new HttpService();
    const [activeTab, setActiveTab] = useState('productos');
    const selectedStore = useStore((state) => state.selectedStore);

    // Users data
    const [productData, setProductData] = useState([]);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [editDataProduct, setEditDataProduct] = useState({
        edit: false,
        productToEdit: null,
    });
    const role = useStore((state) => state.jwtData?.role);

    // Categories data
    const [categoriesData, setCategoriesData] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [editDataCategories, setEditDataCategories] = useState({
        edit: false,
        categorieToEdit: null,
    });

    useEffect(() => {
        getProducts();
        getCategories();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getProducts = async () => {
        try {
            setLoadingProduct(true);
            const response = await httpService.getData(`/product?storeId=${selectedStore}`);
            if (response.status === 200) {
                setProductData(response.data || []);
            } else {
                errorAlert('Error', 'No se pudo obtener la lista de productos');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            errorAlert('Error', 'No se pudo obtener la lista de productos');
        } finally {
            setLoadingProduct(false);
        }
    };

    const getCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await httpService.getData('/category');
            if (response.status === 200) {
                setCategoriesData(response.data || []);
            } else {
                errorAlert('Error', 'No se pudo obtener la lista de categorias');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            errorAlert('Error', 'No se pudo obtener la lista de categorias');
        } finally {
            setLoadingCategories(false);
        }
    }

    return (
        <div className="main_container">
            {/* Tabs de navegación */}
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === 'productos' ? 'active' : ''
                        }`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('productos');
                        }}
                    >
                        📦 Productos
                    </a>
                </li>

                {
                    ['Admin', 'Moderador'].includes(role) && (
                        <li className="nav-item">
                            <a
                                className={`nav-link ${
                                    activeTab === 'crear_producto' ? 'active' : ''
                                }`}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('crear_producto');
                                }}
                            >
                                {editDataProduct.edit ? '✏️📦 Editar Producto' : '➕📦 Crear Producto'}
                            </a>
                        </li>
                    )
                }
                
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === 'categorias' ? 'active' : ''
                        }`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('categorias');
                        }}
                    >
                        🏷️ Categorias
                    </a>
                </li>

                {
                    ['Admin', 'Moderador'].includes(role) && (
                        <li className="nav-item">
                            <a
                                className={`nav-link ${
                                    activeTab === 'crear_categoria' ? 'active' : ''
                                }`}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab('crear_categoria');
                                }}
                            >
                                {editDataCategories.edit ? 'Editar Categoria' : '➕🏷️ Crear Categoria'}
                            </a>
                        </li>
                    )
                }
                
            </ul>

            {/* Contenido de cada tab */}
            <div className="tab-content mt-3">
                {activeTab === 'productos' && (
                    <div className="tab-pane fade show active">
                        {/* <h1 className="text-center mt-4 pt-4">Productos</h1>
                        <h4 className="text-center mb-4">Lista de Productos</h4> */}
                        <TableProduct 
                            productData={productData}
                            getProducts={getProducts}
                            loadingProduct={loadingProduct}
                            setLoadingProduct={setLoadingProduct}
                            handleTabChange={handleTabChange}
                            setEditDataProduct={setEditDataProduct}
                            setEditDataCategories={setEditDataCategories}
                        />

                    </div>
                )}
                {activeTab === 'crear_producto' && (
                    <div className="tab-pane fade show active">
                        <FormProduct 
                            getProducts={getProducts}
                            loadingProduct={loadingProduct}
                            setLoadingProduct={setLoadingProduct}
                            handleTabChange={handleTabChange}
                            setEditDataProduct={setEditDataProduct}
                            getCategories={getCategories}
                            categoriesData={categoriesData}
                            editDataProduct={editDataProduct}
                            setEditDataCategories={setEditDataCategories}
                        />
                    </div>
                )}
                {activeTab === 'categorias' && (
                    <div className="tab-pane fade show active">
                        {/* <h1 className="text-center mt-4 pt-4">Categorías</h1>
                        <h4 className="text-center mb-4">Lista de Categorías</h4> */}
                        <TableCategories 
                            loadingCategories={loadingCategories}
                            setLoadingCategories={setLoadingCategories}
                            categoriesData={categoriesData}
                            getCategories={getCategories}
                            handleTabChange={handleTabChange}
                            setEditDataCategories={setEditDataCategories}
                            setEditDataProduct={setEditDataProduct}
                        />
                    </div>
                )}
                {activeTab === 'crear_categoria' && (
                    <div className="tab-pane fade show active">
                        <FormCategorias 
                            setEditDataCategories={setEditDataCategories}
                            editDataCategories={editDataCategories}
                            handleTabChange={handleTabChange}
                            setEditDataProduct={setEditDataProduct}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Productos;
