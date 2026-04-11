import React from 'react'
import './DetalleProducto.scss'
import useStore from '@store/useStore';
import ZoomableImage from '@admin-shared/ZoomableImage/ZoomableImage';
import { confirmAlert } from '@helpers/alerts';

const DetalleProducto = ({
  selectedProduct,
  quantity,
  expirationDates,
  handleCreateStock,
  handleQuantityChange,
  handleDateChange,
}) => {

  const jwtData = useStore((state) => state.jwtData);
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const selectedStore = useStore((state) => state.selectedStore);


  console.log('selectedProduct', selectedProduct);

  // Función que retorna la clase de stock según la cantidad
  const getStockClass = (quantity) => {
    if (quantity >= 10) return 'high';
    if (quantity >= 5) return 'medium';
    return 'low';
  };

  // Función que simula enviar el body para crear unidades de stock
  const simulateSendStock = async () => {
    if (!selectedProduct?.id) {
      return;
    }

    // Si el producto es perecedero, se requiere que se hayan ingresado todas las fechas
    if (selectedProduct?.perishable) {
      // Validamos que exista un arreglo de fechas y que para cada unidad se haya ingresado una fecha (o al menos no esté vacía)
      if (!expirationDates || expirationDates.length < quantity || expirationDates.some(date => !date || date.trim() === '')) {
        alert("Debe ingresar todas las fechas de vencimiento para el producto perecedero.");
        return;
      }
    }

    const confirm = await confirmAlert(
                'Confirmar acción',
                `¿Está seguro de que desea crear ${quantity} unidades de stock para el producto ${selectedProduct.name}?`,
                'warning'
            );

    if (!confirm) return; // Si el usuario no confirma, no se envía el stock
    
    // Se arma el body basándose en el producto seleccionado y demás estados
    const payload = {
      productId: selectedProduct?.id,
      storeId: selectedStore,
      quantity,
      ...(selectedProduct?.perishable && { expirationDates }),
    };
    
    handleCreateStock(payload); // Llama a la función que maneja el envío del stock
  };


  return (
    <div className="col-md-8 detalle_producto_container">
      {selectedProduct ? (
        <div className="detalle_producto">
          <h5 className="text-center">Detalles del Producto</h5>
          <div className="d-flex">
            <p className="chip w-50">
              <strong>Código:</strong> {selectedProduct.code}
            </p>
            <p className={`chip w-50 stock ${ getStockClass(selectedProduct?.stockunit?.length)}`}>
                                          
              <strong>STOCK:</strong> {selectedProduct?.stockunit?.length || 0} unidades
            </p>
          </div>
          <p className="chip">
            <strong>Nombre:</strong> {selectedProduct.name}
          </p>
          <p className="chip">
            <strong>Categoría:</strong>{' '}
            {selectedProduct.category?.name || 'Sin categoría'}
          </p>
          {jwtData?.roleId === 2 && (
            <p className="chip">
              <strong>Precio de Compra:</strong> {selectedProduct.purchasePrice}
            </p>
          )}
          <p className="chip">
            <strong>Precio de Venta:</strong> {selectedProduct.salePrice}
          </p>
          <p className="chip">
            <strong>Status:</strong> {selectedProduct.status}
          </p>
          <p className="chip">
            <strong>Perecedero:</strong> {selectedProduct.perishable ? 'Sí' : 'No'}
          </p>
         
          {selectedProduct.image && (
            <div>
              <p>
                <strong>Imagen:</strong>
              </p>
              <ZoomableImage
                  src={`${process.env.NEXT_PUBLIC_BACK_HOST}/${selectedProduct.image}`}
                  alt="Producto"
                  thumbnailWidth={50}
                  thumbnailHeight={50}
              />
            </div>
          )}

          {/* Formulario para agregar stock */}
          <h5 className="mt-4 text-center pt-4">➕ Agregar al Stock</h5>

          {/* Cantidad a agregar */}
          <div className="mb-3">
            <label className="form-label fs-4">Cantidad a agregar</label>
            <div className="d-flex align-items-center quantity_container">
              <button
                className="btn btn-secondary btn-sm me-2 fs-4"
                onClick={() => handleQuantityChange(quantity - 1)}
              >
                -
              </button>
              <input
                type="number"
                className="form-control text-center input_quantity fs-4"
                value={quantity}
                min={1}
                style={{ maxWidth: '80px' }}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              />
              <button
                className="btn btn-secondary btn-sm ms-2 fs-4"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Fechas de vencimiento para productos perecederos */}
          {selectedProduct.perishable && (
            <div className="mb-3">
              <label className="form-label fs-4">Fechas de vencimiento</label>
              {Array.from({ length: quantity }).map((_, i) => (
                <input
                  key={i}
                  type="date"
                  min={today}
                  className="form-control mb-2 fs-4"
                  value={expirationDates[i] || ''}
                  onChange={(e) => handleDateChange(i, e.target.value)}
                />
              ))}
            </div>
          )}

          <button className="button_send" onClick={simulateSendStock}>
            Crear unidades de stock
          </button>
        </div>
      ) : (
        <p className="text-muted">
          Selecciona un producto de la izquierda para ver sus detalles y agregar stock.
        </p>
      )}
    </div>
  );
};

export default DetalleProducto;
