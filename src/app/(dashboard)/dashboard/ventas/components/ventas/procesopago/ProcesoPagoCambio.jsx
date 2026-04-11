import React, { useMemo, useState, useEffect } from 'react';
import useStore from '@store/useStore';
import SelectMetodoPago from '../selectMetodoPago/SelectMetodoPago';
import { errorAlert, confirmAlert, timerAlert } from '@helpers/alerts';
import HttpService from '@services/HttpService';
import './ProcesoPagoCambio.scss';

const ProcesoPagoCambio = ({ fetchProducts }) => {
  const dataCambio    = useStore((s) => s.dataCambio);
  const returnedItems = useStore((s) => s.returnedItems);
  const cartItems     = useStore((s) => s.cartItems);
  const tipoPago      = useStore((s) => s.tipoPago);
  const setTipoPago   = useStore((s) => s.setTipoPago);
  const jwtData       = useStore((s) => s.jwtData);
  const selectedStore = useStore((s) => s.selectedStore);
  const resetFinisedSale = useStore((s) => s.resetFinisedSale);
  const setReturnedItems = useStore((s) => s.setReturnedItems);
  const setDataCambio    = useStore((s) => s.setDataCambio);

  const httpService = new HttpService();

  // 1) Total original (fijo)
  const originalTotal = useMemo(() => {
    const amt = dataCambio?.dataRecibo?.totalAmount;
    return amt != null ? parseFloat(amt) : 0;
  }, [dataCambio]);

  // 2) Sumas parciales
  const returnedSum = useMemo(
    () => returnedItems.reduce((sum, i) => sum + parseFloat(i.unitPrice || 0), 0),
    [returnedItems]
  );
  const replacementSum = useMemo(
    () =>
      cartItems.reduce(
        (sum, i) =>
          sum +
          (i.priceWithItemCoupon != null
            ? i.priceWithItemCoupon
            : parseFloat(i.product.salePrice)),
        0
      ),
    [cartItems]
  );

  // 3) Diferencia a pagar (>=0)
  const diff     = replacementSum - returnedSum;
  const newTotal = diff > 0 ? diff : 0;

  // 4) Estados de efectivo / cambio
  const [efectivo, setEfectivo] = useState('');
  const [cambio, setCambio]     = useState(0);
  const [loading, setLoading]   = useState(false);

  // Reset cuando cambia método o diff
  useEffect(() => {
    setEfectivo('');
    setCambio(0);
  }, [tipoPago, diff]);

  // Validación monto recibido
  const validarEfectivo = async (raw) => {
    const val = parseFloat(raw);
    if (isNaN(val)) {
      await errorAlert('Error', 'El monto recibido no es un número válido');
      setCambio(0);
      return false;
    }
    if (val < newTotal) {
      await errorAlert('Error', 'El monto recibido no puede ser menor al saldo a pagar');
      setCambio(0);
      return false;
    }
    setCambio(val - newTotal);
    return true;
  };

  // 5) Finalizar cambio
  const handleFinalizarCambio = async () => {
    // if (newTotal <= 0) {
    //   return errorAlert('Error', 'No hay saldo a pagar. Agrega o devuelve productos primero.');
    // }
    if (!tipoPago) {
      return errorAlert('Error', 'Selecciona un método de pago.');
    }
    if (tipoPago === 'efectivo') {
      const ok = await validarEfectivo(efectivo);
      if (!ok) return;
    }

    const confirm = await confirmAlert('Confirmar', '¿Deseas guardar este cambio?');
    if (!confirm) return;

    const payload = {
      storeId: parseInt(selectedStore),
      userId: jwtData.id,
      paymentMethod: tipoPago,
      total: newTotal,
      totalSinCupon: newTotal,
      cupon: null,
      received: tipoPago === 'efectivo' ? parseFloat(efectivo) : 0,
      change: tipoPago === 'efectivo' ? parseFloat(cambio) : 0,
      items: cartItems.map((i) => ({
        stockUnitId: i.id,
        productId: i.productId,
        price: i.priceWithItemCoupon ?? parseFloat(i.product.salePrice),
        itemCoupon: i.itemCoupon?.code ?? null,
      })),
      returnedItems: returnedItems.map((i) => ({
        stockUnitId: i.stockUnitId,
      })),
      originalSaleId: dataCambio.dataRecibo.id,
      type: 'cambio',
    };

    try {
      setLoading(true);
      const res = await httpService.postData('/sale', payload);
      if (res.status === 201) {
        await timerAlert('Éxito', 'Cambio registrado con éxito', 1500);

        // limpia estados
        resetFinisedSale();
        setReturnedItems([]);
        setDataCambio(null);

        // abre PDF del cambio
        const BACK = process.env.NEXT_PUBLIC_BACK_HOST;
        window.open(`${BACK}/sale/generate-pdf/${res.data.sale.id}`, '_blank');

        //refrescar la wen en 1 segundo
        setTimeout(() => {
            window.location.reload();
        }, 1000);

      } else {
        errorAlert('Error', 'No se pudo registrar el cambio');
      }
    } catch (err) {
      console.error(err);
      errorAlert('Error', 'Ocurrió un problema al guardar el cambio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="proceso_pago_cambio_container">
      <div className="original_sale_container">
        <h5>Costo Factura Original</h5>
        <p>${originalTotal.toFixed(2)}</p>
      </div>

      <div className="new_sale_container">
        <h5>Saldo a pagar</h5>
        <p>${newTotal.toFixed(2)}</p>
      </div>

      <SelectMetodoPago tipoPago={tipoPago} setTipoPago={setTipoPago} />

      {tipoPago === 'efectivo' && (
        <div className="efectivo_cambio_container mt-5">
          <div className="efectivo_container">
            <label htmlFor="efectivo">Recibido</label>
            <input
              type="number"
              id="efectivo"
              placeholder="0.00"
              min="0"
              value={efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              onBlur={() => validarEfectivo(efectivo)}
            />
          </div>
          <div className="cambio_container">
            <label htmlFor="cambio">Cambio</label>
            <input
              type="number"
              id="cambio"
              placeholder="0.00"
              value={cambio.toFixed(2)}
              disabled
            />
          </div>
        </div>
      )}

      <div className="finish_sale_container mt-4">
        <button
          className="btn_finalizar_venta"
          onClick={handleFinalizarCambio}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Finalizar Cambio'}
        </button>
      </div>
    </div>
  );
};

export default ProcesoPagoCambio;
