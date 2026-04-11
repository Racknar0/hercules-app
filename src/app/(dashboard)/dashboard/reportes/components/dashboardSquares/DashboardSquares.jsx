import React from 'react';
import './DashboardSquares.scss';

const DashboardSquares = ({ dataSales }) => {
  const sales = Array.isArray(dataSales) ? dataSales : [];

  const toNumber = v => parseFloat(v) || 0;
  const totalCostoVentas = sales
    .filter(s => s.type === 'venta')
    .reduce((sumSale, sale) => {
      const subtotal = (sale.saleItems || []).reduce(
        (sumItem, it) => sumItem + toNumber(it.product.purchasePrice),
        0
      );
      return sumSale + subtotal;
    }, 0);

  const totalVentas = sales.reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);
  const totalProductos = sales.reduce((sum, sale) => sum + (sale.saleItems?.length || 0), 0);
  const totalTickets = sales.length;

  const totalEfectivo = sales
    .filter(s => s.paymentMethod === 'efectivo')
    .reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);

  const totalTarjeta = sales
    .filter(s => s.paymentMethod === 'tarjeta')
    .reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);

  const totalTransferencias = sales
    .filter(s => s.paymentMethod === 'transferencia')
    .reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);

  const totalCambios = sales
    .filter(s => s.type === 'cambio')
    .reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);

  const totalGanancias = totalVentas - totalCostoVentas;

  const formatMoney = (num) => {
    const value = Number(num || 0);
    return `$${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)}`;
  };

  const metrics = [
    { title: 'TOTAL VENTAS', value: formatMoney(totalVentas), icon: '💰' },
    { title: 'TOTAL PRODUCTOS', value: totalProductos.toLocaleString('es-CO'), icon: '📦' },
    { title: 'TOTAL TICKETS', value: totalTickets.toLocaleString('es-CO'), icon: '🧾' },
    { title: 'TOTAL EFECTIVO', value: formatMoney(totalEfectivo), icon: '💵' },
    { title: 'TOTAL TARJETA', value: formatMoney(totalTarjeta), icon: '💳' },
    { title: 'TOTAL TRANSFERENCIAS', value: formatMoney(totalTransferencias), icon: '🏦' },
    { title: 'TOTAL CAMBIOS', value: formatMoney(totalCambios), icon: '🔁' },
    { title: 'TOTAL COSTO', value: formatMoney(totalCostoVentas), icon: '📉' },
    { title: 'TOTAL GANANCIAS', value: formatMoney(totalGanancias), icon: '📈' },
  ];

  return (
    <div className="dashboard-cards-grid">
      {metrics.map((m, i) => (
        <div key={i} className="dashboard-card">
          <div className="dashboard-card-icon" aria-hidden="true">{m.icon}</div>
          <div className="dashboard-card-value">{m.value}</div>
          <div className="dashboard-card-title">{m.title}</div>
        </div>
      ))}
    </div>
  );
};

export default DashboardSquares;
