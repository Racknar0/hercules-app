import React, { useState } from 'react';
import './StockTable.scss'; // Asegúrate de tener tus estilos

const StockTable = ({
  stockUnits,
  selectedStockIds,
  setSelectedStockIds,
  toggleStockSelection,
  onEditExpiration, // nueva prop
}) => {
  const [editingId, setEditingId] = useState(null);
  const [tempDate, setTempDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Ordenar stockUnits por createdAt en orden ascendente (las más antiguas primero)
  const sortedStockUnits = [...stockUnits].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Para la fecha de vencimiento solo se muestra la fecha (por ejemplo "04-marzo-2025")
  const formatLocaleDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Para la fecha de creación se muestra fecha y hora
  const formatLocaleDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toInputDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const startEdit = (stock) => {
    setEditingId(stock.id);
    setTempDate(toInputDate(stock.expirationDate));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempDate('');
  };

  const saveEdit = async (id) => {
    if (!onEditExpiration) return;
    setSaving(true);
    try {
      await onEditExpiration(id, tempDate);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-body">
      {sortedStockUnits.length === 0 ? (
        <p>No hay unidades de stock para este producto en esta tienda.</p>
      ) : (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStockIds(sortedStockUnits.map((s) => s.id));
                    } else {
                      setSelectedStockIds([]);
                    }
                  }}
                  checked={selectedStockIds.length === sortedStockUnits.length}
                />
              </th>
              <th>#</th>
              <th>Tienda</th>
              <th>Fecha de Vencimiento</th>
              <th>Fecha de Creación</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {sortedStockUnits.map((stock, index) => (
              <tr key={stock.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStockIds.includes(stock.id)}
                    onChange={() => toggleStockSelection(stock.id)}
                  />
                </td>
                {/* Enumeración: se usa el índice + 1 */}
                <td>{index + 1}</td>
                <td>{stock.store?.name}</td>
                <td>
                  {editingId === stock.id ? (
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                      />
                    </div>
                  ) : stock.expirationDate ? (
                    formatLocaleDate(stock.expirationDate)
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{formatLocaleDateTime(stock.createdAt)}</td>
                <td>
                  {editingId === stock.id ? (
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-success"
                        disabled={saving}
                        onClick={() => saveEdit(stock.id)}
                      >
                        Guardar
                      </button>
                      <button className="btn btn-secondary" onClick={cancelEdit}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      title="Editar fecha de vencimiento"
                      onClick={() => startEdit(stock)}
                    >
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockTable;
