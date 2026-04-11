import React, { useEffect, useState } from 'react';
import { confirmAlert, errorAlert, successAlert } from '@helpers/alerts';
import HttpService from '@services/HttpService';
import Spinner from '@admin-shared/spinner/Spinner';
import './FormProduct.scss'

const FormProduct = ({
    editDataProduct,
    setEditDataProduct,
    handleTabChange,
    categoriesData,
    getProducts,
    getCategories,
    setEditDataCategories
}) => {

    useEffect(() => {
        setEditDataCategories({ edit: false, categorieToEdit: null });
        getCategories();
    }, []);

    const httpService = new HttpService();
    const [loading, setLoading] = useState(false);

    const [product, setProduct] = useState({
        name: '',
        code: '',
        barcode: '',
        categoryId: '',
        purchasePrice: '',
        salePrice: '',
        perishable: false,
        image: null,
        hasTax: false
    });


    // Ejecutamos este useEffect SOLO cuando se carga un producto a editar (basándonos en su id)
    useEffect(() => {
        if (editDataProduct.edit && editDataProduct.productToEdit) {
            const {
                name,
                code,
                barcode,
                categoryId,
                purchasePrice,
                salePrice,
                perishable,
            } = editDataProduct.productToEdit;

            setProduct({
                name,
                code,
                barcode: barcode || '',
                categoryId,
                purchasePrice,
                salePrice,
                perishable,
                image: null,
                hasTax: editDataProduct.productToEdit.hasTax
            });
        }
    // Se actualiza solo cuando cambia el id del producto a editar
    }, [editDataProduct.productToEdit?.id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageChange = (e) => {
        setProduct((prev) => ({
            ...prev,
            image: e.target.files[0],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { name, code, categoryId, purchasePrice, salePrice } = product;

        console.log('product', product);


        if (!name || !code || !categoryId || !purchasePrice || !salePrice) {
            return errorAlert('Error', 'Por favor, completa todos los campos.');
        }

        if (parseFloat(product.purchasePrice) >= parseFloat(product.salePrice)) {
            return errorAlert('Error', 'El precio de compra no puede ser mayor o igual que el de venta.');
        }

        const formData = new FormData();

        // Agrega manualmente el archivo con la key "productImage"
        if (product.image) {
            formData.append('productImage', product.image);
        }
        
        // Agrega el resto de los campos
        formData.append('name', product.name);
        formData.append('code', product.code);
        if (product.barcode) {
            formData.append('barcode', product.barcode);
        }
        formData.append('categoryId', product.categoryId);
        formData.append('purchasePrice', product.purchasePrice);
        formData.append('salePrice', product.salePrice);
        formData.append('perishable', product.perishable);
        formData.append('hasTax', product.hasTax);

        const confirm = await confirmAlert(
            'Confirmar acción',
            `¿Está seguro de que desea ${editDataProduct.edit ? 'actualizar' : 'crear'} el producto ${product.name}?`,
            'warning'
        );

        if (!confirm) return;

        setLoading(true);
        try {
            let response;
            if (editDataProduct.edit) {
                response = await httpService.putFormData(
                    '/product',
                    editDataProduct.productToEdit.id,
                    formData
                );
            } else {
                response = await httpService.postFormData('/product', formData);
            }

            if (response.status !== 200 && response.status !== 201){
                errorAlert('Error', 'Algo salió mal al guardar el producto');
            } else {
                successAlert(
                    editDataProduct.edit
                        ? 'Producto actualizado'
                        : 'Producto creado',
                    `El producto ha sido ${editDataProduct.edit ? 'actualizado' : 'creado'} exitosamente.`
                );
                setEditDataProduct({ edit: false, productToEdit: null });
                handleTabChange('productos');
                getProducts();
            }
        } catch (error) {
            const { response } = error;
            errorAlert('Error', `${response.data.message || 'No se pudo crear el rol. Por favor, inténtelo de nuevo.'}`);
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateBarcode = async () => {
        try {
            const response = await httpService.getData('/product/generate-barcode');
            if (response.status === 200) {
                setProduct((prev) => ({
                    ...prev,
                    barcode: response.data.barcode
                }));
                successAlert('Éxito', 'Código de barras generado automáticamente');
            } else {
                errorAlert('Error', 'No se pudo generar el código de barras');
            }
        } catch (error) {
            console.error('Error al generar código de barras:', error);
            errorAlert('Error', 'No se pudo generar el código de barras');
        }
    };

    return (
        <div className="form_main_container">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        required
                        placeholder='Nombre del producto'
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Código</label>
                    <input
                        type="text"
                        className="form-control"
                        name="code"
                        value={product.code}
                        onChange={handleChange}
                        required
                        placeholder='XXXXX'
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Categoría</label>
                    <select
                        className="form-select"
                        name="categoryId"
                        value={product.categoryId}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Selecciona una categoría</option>
                        {categoriesData.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Precio de compra</label>
                    <input
                        type="number"
                        className="form-control"
                        name="purchasePrice"
                        value={product.purchasePrice}
                        onChange={handleChange}
                        required
                        placeholder='Cuánto le costó a la tienda'
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Precio de venta</label>
                    <input
                        type="number"
                        className="form-control"
                        name="salePrice"
                        value={product.salePrice}
                        onChange={handleChange}
                        required
                        placeholder='En cuánto se vende al cliente'
                    />
                </div>

                <div className="mb-3 form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="hasTax"
                        checked={product.hasTax}
                        onChange={handleChange}
                    />
                    <label className="form-check-label">¿Incluye Impuesto?</label>
                </div>

                <div className="mb-3 form-check">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="perishable"
                        checked={product.perishable}
                        onChange={handleChange}
                    />
                    <label className="form-check-label">¿Es perecedero?</label>
                </div>

                <div className="mb-3">
                    <label className="form-label">Imagen</label>
                    <input
                        type="file"
                        className="form-control"
                        name="productImage"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Código de Barras</label>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            name="barcode"
                            value={product.barcode}
                            onChange={handleChange}
                            placeholder='Código de barras (opcional)'
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={generateBarcode}
                            title="Generar código de barras automático"
                        >
                            🔢 Generar
                        </button>
                    </div>
                    <small className="form-text text-muted">
                        Si no proporcionas un código de barras, puedes generarlo automáticamente
                    </small>
                </div>

                {!loading ? (
                    <button type="submit" className="btn_submit">
                        {editDataProduct.edit
                            ? 'Actualizar producto'
                            : 'Crear producto'}
                    </button>
                ) : (
                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <Spinner color="#6564d8" />
                    </div>
                )}
            </form>
        </div>
    );
};

export default FormProduct;
