import React, { useEffect, useMemo, useState } from 'react';
import HttpService from '@services/HttpService';
import {
    confirmAlert,
    errorAlert,
    successAlert,
    warningAlert,
} from '@helpers/alerts';
import Search from './components/stock/buscador/Search.jsx';
import DetalleProducto from './components/stock/detalle/DetalleProducto.jsx';
import useStore from '@store/useStore';
import './Stock.scss';
import Modal from '@admin-shared/modal/Modal';
import StockTable from './components/stock/stockTable/StockTable.jsx';   
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import useChunkedVirtualizedList from '@helpers/useChunkedVirtualizedList';

// const mockStores = [
//   { id: 1, name: 'Tienda Centro' },
//   { id: 2, name: 'Tienda Norte' },
// ];

const Stock = () => {
    const httpService = new HttpService();
    const selectedStore = useStore((state) => state.selectedStore);

    // Estados para los productos y la selección
    const [productData, setProductData] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    // const [mockStores, setMockStores] = useState([]); //* Descomentar para obtener las tiendas desde el backend
    const setSelectedStore = useStore((state) => state.setSelectedStore);
    const [loaddingButtonStock, setLoadingButtonStock] = useState(false);

    // Estado para el término de búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [sortMode, setSortMode] = useState('default');

    // Estados para el formulario de agregar stock
    const [quantity, setQuantity] = useState(1);
    const [expirationDates, setExpirationDates] = useState(['']);

    // Estados para el modal de stock
    const [showModal, setShowModal] = useState(false);
    const [stockUnits, setStockUnits] = useState([]);
    const [selectedStockIds, setSelectedStockIds] = useState([]);

    console.log('selectedStockIds:', selectedStockIds);
    console.log('stockUnits:', stockUnits);

    useEffect(() => {
        getProducts();
        // getStores(); //* Descomentar para obtener las tiendas desde el backend
    }, []);

    useEffect(() => {
        getProducts();
    }, [selectedStore]);

    const getProducts = async () => {
        setSelectedProduct(null);
        setQuantity(1);
        setExpirationDates(['']);
        setSelectedStockIds([]);

        try {
            setLoadingProducts(true);
            const response = await httpService.getData(
                `/product?storeId=${selectedStore}`
            );
            if (response.status === 200) {
                setProductData(response.data || []);
            } else {
                errorAlert('Error', 'No se pudo obtener la lista de productos');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            errorAlert('Error', 'No se pudo obtener la lista de productos');
        } finally {
            setLoadingProducts(false);
        }
    };

    // Filtramos los productos por nombre o código, sin importar mayúsculas/minúsculas
    const filteredProducts = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return productData.filter((prod) => (
            prod.name.toLowerCase().includes(term) ||
            prod.code.toLowerCase().includes(term) ||
            prod.category.name.toLowerCase().includes(term)
        ));
    }, [productData, searchTerm]);

    const sortedProducts = useMemo(() => {
        const items = [...filteredProducts];
        const collator = new Intl.Collator('es', {
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: true,
        });

        const normalizeProductName = (value) =>
            String(value || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();

        const normalizeCode = (value) =>
            String(value || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toLowerCase();

        if (sortMode === 'alphabetical') {
            items.sort((left, right) => {
                const leftName = normalizeProductName(left?.name);
                const rightName = normalizeProductName(right?.name);

                const leftIsEmpty = leftName.length === 0;
                const rightIsEmpty = rightName.length === 0;

                if (leftIsEmpty !== rightIsEmpty) {
                    return leftIsEmpty ? 1 : -1;
                }

                const byName = collator.compare(leftName, rightName);
                if (byName !== 0) {
                    return byName;
                }

                return collator.compare(
                    normalizeCode(left?.code),
                    normalizeCode(right?.code)
                );
            });
        }

        if (sortMode === 'stockDesc') {
            items.sort(
                (left, right) =>
                    (right.stockunit?.length || 0) - (left.stockunit?.length || 0)
            );
        }

        return items;
    }, [filteredProducts, sortMode]);

    const {
        visibleItems: visibleProducts,
        visibleCount: visibleProductsCount,
        totalCount: totalProductsCount,
        hasMore: hasMoreProducts,
        loaderRef: productsLoaderRef,
        loadMore: loadMoreProducts,
    } = useChunkedVirtualizedList(sortedProducts, {
        batchSize: 20,
        resetKey: `${searchTerm}|${sortMode}|${sortedProducts.length}`,
    });

    // Al seleccionar un producto, lo establecemos y reiniciamos cantidad y fechas
    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setExpirationDates(['']);
    };

    // Maneja el cambio de cantidad, asegurando mínimo 1; si es perecedero, ajusta el array de fechas.
    const handleQuantityChange = (newQty) => {
        const newQuantity = Math.max(1, newQty);
        setQuantity(newQuantity);
        if (selectedProduct?.perishable) {
            const dates = Array(newQuantity)
                .fill('')
                .map((_, i) => expirationDates[i] || '');
            setExpirationDates(dates);
        }
    };

    // Actualiza la fecha de vencimiento en la posición indicada
    const handleDateChange = (index, value) => {
        const newDates = [...expirationDates];
        newDates[index] = value;
        setExpirationDates(newDates);
    };

    // Envía el payload para crear stock y actualiza la lista de productos
    const handleCreateStock = async (payload) => {
        try {
            const response = await httpService.postData('/stock', payload);
            if (response.status === 201) {
                successAlert('Éxito', 'Stock creado exitosamente');
                setSelectedProduct(null);
                setQuantity(1);
                setExpirationDates(['']);
                getProducts();
            } else {
                errorAlert('Error', 'No se pudo crear el stock');
            }
        } catch (error) {
            console.error('Error al crear stock:', error);
            errorAlert('Error', 'No se pudo crear el stock');
        }
    };

    // Función para simular el envío del formulario de crear stock
    const simulateCreateStock = () => {
        // Para productos perecederos, se puede validar que se hayan ingresado todas las fechas
        if (selectedProduct?.perishable) {
            if (
                !expirationDates ||
                expirationDates.length < quantity ||
                expirationDates.some((date) => !date || date.trim() === '')
            ) {
                console.error(
                    'Error: El producto perecedero requiere fechas de vencimiento para cada unidad.'
                );
                alert(
                    'Debe ingresar todas las fechas de vencimiento para el producto perecedero.'
                );
                return;
            }
        }

        const payload = {
            productId: selectedProduct.id,
            storeId: selectedStore,
            quantity,
            ...(selectedProduct.perishable && { expirationDates }),
        };
        console.log('Simulación de envío de stock:', payload);
        // Llamar a handleCreateStock con el payload
        handleCreateStock(payload);
    };

    // Abrir el modal y obtener el stock para el producto seleccionado y la tienda actual
    const openStockModal = async () => {
        console.log('Abrir modal de stock para el producto:', selectedProduct);
        console.log('Tienda seleccionada:', selectedStore);

        if (!selectedProduct) {
            errorAlert('Error', 'Seleccione un producto para ver el stock');
            return;
        }
        try {
            setLoadingButtonStock(true);
            const response = await httpService.getData(
                `/stock/${selectedProduct.id}/stockunits?storeId=${selectedStore}`
            );
            if (response.status === 200) {
                console.log('Stock units:', response.data);
                setStockUnits(response.data);
                setSelectedStockIds([]); // resetear selección
                setShowModal(true);
            } else {
                errorAlert('Error', 'No se pudo obtener el stock');
            }
        } catch (error) {
            console.error('Error fetching stock units:', error);
            errorAlert('Error', 'No se pudo obtener el stock');
        } finally {
            setLoadingButtonStock(false);
        }
    };

    // Manejar la selección de un checkbox en la tabla de stock
    const toggleStockSelection = (stockId) => {
        if (selectedStockIds.includes(stockId)) {
            setSelectedStockIds(
                selectedStockIds.filter((id) => id !== stockId)
            );
        } else {
            setSelectedStockIds([...selectedStockIds, stockId]);
        }
    };

    // // Función para borrar las stock units seleccionadas
    const handleBulkDelete = async () => {
        if (selectedStockIds.length === 0) {
            warningAlert(
                'Advertencia',
                'Seleccione al menos una unidad de stock para eliminar'
            );
            return;
        }

        const confirm = await confirmAlert(
            'Confirmar acción',
            `¿Está seguro de que desea eliminar las unidades de stock seleccionadas?`,
            'warning'
        );
        if (!confirm) return;

        try {
            const response = await httpService.deleteDataWithBody('/stock', {
                ids: selectedStockIds,
            });
            if (response.status === 200) {
                successAlert(
                    'Éxito',
                    'Unidades de stock eliminadas exitosamente'
                );
                getProducts(); // Refrescar la lista de productos
            } else {
                errorAlert(
                    'Error',
                    'No se pudo eliminar las unidades de stock'
                );
            }
        } catch (error) {
            console.error('Error al eliminar stock units:', error);
            errorAlert('Error', 'No se pudo eliminar las unidades de stock');
        } finally {
            setShowModal(false);
        }
    };

    const handleExportStock = async () => {
        const toNumberOrNull = (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Stock', {
            views: [{ state: 'frozen', ySplit: 4 }],
        });

        const columns = [
            { header: 'Nombre', key: 'nombre', width: 36 },
            { header: 'Categoria', key: 'categoria', width: 20 },
            { header: 'Codigo', key: 'codigo', width: 16 },
            { header: 'Incluye Impuesto', key: 'incluyeImpuesto', width: 18 },
            { header: 'Perecedero', key: 'perecedero', width: 14 },
            { header: 'Precio Compra', key: 'precioCompra', width: 15 },
            { header: 'Precio Venta', key: 'precioVenta', width: 15 },
            { header: 'Stock', key: 'stock', width: 10 },
        ];

        worksheet.columns = columns;

        const todayText = new Date().toLocaleString('es-MX');
        worksheet.mergeCells(1, 1, 1, columns.length);
        worksheet.getCell('A1').value = 'Reporte de Stock';
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F2937' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells(2, 1, 2, columns.length);
        worksheet.getCell('A2').value = `Generado: ${todayText}`;
        worksheet.getCell('A2').font = { italic: true, size: 11, color: { argb: 'FF4B5563' } };
        worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getRow(4).values = columns.map((c) => c.header);

        filteredProducts.forEach((prod) => {
            worksheet.addRow({
                nombre: prod.name,
                categoria: prod.category?.name || 'Sin categoria',
                codigo: prod.code,
                incluyeImpuesto: prod.hasTax ? 'Si' : 'No',
                perecedero: prod.perishable ? 'Si' : 'No',
                precioCompra: toNumberOrNull(prod.purchasePrice),
                precioVenta: toNumberOrNull(prod.salePrice),
                stock: prod.stockunit.length,
            });
        });

        const headerRow = worksheet.getRow(4);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF374151' },
            };
            cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            };
        });

        worksheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: 4, column: columns.length },
        };

        for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber += 1) {
            const row = worksheet.getRow(rowNumber);
            const isEven = rowNumber % 2 === 0;

            row.eachCell((cell) => {
                cell.alignment = { vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                };
                if (isEven) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF9FAFB' },
                    };
                }
            });

            [6, 7].forEach((columnIndex) => {
                const cell = row.getCell(columnIndex);
                if (typeof cell.value === 'number') {
                    cell.numFmt = '$#,##0.00';
                }
            });
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, `stock_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="container-fluid mt-4 main_container">
            <div className="stock-toolbar mb-4">
                <h1 className="stock-title">Gestión de Stock</h1>

                <button
                className="exportar_btn"
                onClick={handleExportStock}
                >
                Exportar Stock
                </button>
            </div>

            <div className="row">
                {/* Panel izquierdo: Lista de productos */}
                <Search
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    loadingProducts={loadingProducts}
                    visibleProducts={visibleProducts}
                    visibleProductsCount={visibleProductsCount}
                    totalProductsCount={totalProductsCount}
                    hasMoreProducts={hasMoreProducts}
                    productsLoaderRef={productsLoaderRef}
                    loadMoreProducts={loadMoreProducts}
                    sortMode={sortMode}
                    setSortMode={setSortMode}
                    selectedProduct={selectedProduct}
                    handleSelectProduct={handleSelectProduct}
                    openStockModal={openStockModal}
                    loadingButtonStock={loaddingButtonStock}
                />
                {/* Panel derecho: Detalle completo del producto y formulario de stock */}
                <DetalleProducto
                    selectedProduct={selectedProduct}
                    quantity={quantity}
                    expirationDates={expirationDates}
                    handleCreateStock={simulateCreateStock}
                    handleQuantityChange={handleQuantityChange}
                    handleDateChange={handleDateChange}
                />
            </div>

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                title="Gestionar Stock"
            >
                <StockTable
                    stockUnits={stockUnits}
                    selectedStockIds={selectedStockIds}
                    setSelectedStockIds={setSelectedStockIds}
                    toggleStockSelection={toggleStockSelection}
                    onEditExpiration={async (id, newDate) => {
                        try {
                            const resp = await httpService.patchData(`/stock/${id}/expiration`, {
                                expirationDate: newDate || null,
                            });
                            if (resp.status === 200) {
                                successAlert('Éxito', 'Fecha de vencimiento actualizada');
                                // refrescar lista dentro del modal
                                const r = await httpService.getData(
                                    `/stock/${selectedProduct.id}/stockunits?storeId=${selectedStore}`
                                );
                                if (r.status === 200) setStockUnits(r.data);
                            } else {
                                errorAlert('Error', 'No se pudo actualizar la fecha');
                            }
                        } catch (e) {
                            console.error('Error actualizando fecha:', e);
                            const msg = e.response?.data?.message || 'Error al actualizar';
                            errorAlert('Error', msg);
                        }
                    }}
                />
                <div className="modal-footer">
                    {selectedStockIds.length > 0 && (
                        <span className="selected-count fw-bold me-auto">
                            {selectedStockIds.length} seleccionados
                        </span>
                    )}
                    <button
                        className="btn btn-danger"
                        onClick={handleBulkDelete}
                    >
                        Eliminar Seleccionados
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Stock;
