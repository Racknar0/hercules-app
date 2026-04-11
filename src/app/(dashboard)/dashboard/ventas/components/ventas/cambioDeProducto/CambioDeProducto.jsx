import React, { useState, useEffect } from 'react';
import useStore from '@store/useStore';

const CambioDeProducto = () => {
  // Traemos del store la data de la venta original
  const dataCambio = useStore((state) => state.dataCambio);
  const saleItems = dataCambio?.dataRecibo?.saleItems || [];
  const returnedItems = useStore((state) => state.returnedItems);
  const setReturnedItems = useStore((state) => state.setReturnedItems);

  // Estado local para controlar qué ítems están seleccionados
  const [selectedItems, setSelectedItems] = useState(returnedItems);

  const handleCheckboxChange = (item) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  // Sincroniza la selección con el padre cada vez que cambie
  useEffect(() => {
    setReturnedItems(selectedItems);
  }, [selectedItems, setReturnedItems]);

  return (
    <div className="p-4" style={{ 
      backgroundColor: '#ff9d00',
     }}>
      <h2 className="mb-4">Panel de Devolución</h2>
      {saleItems.length === 0 ? (
        <p>No hay productos en este recibo para cambiar.</p>
      ) : (
        <ul className="list-group">
          {saleItems.map((item) => {
            const isChecked = selectedItems.some((i) => i.id === item.id);
            return (
              <li
                key={item.id}
                className="list-group-item d-flex justify-content-between align-items-center fs-4"
              >
                <div>
                  <strong>{item.product.name}</strong> — ${item.unitPrice}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(item)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CambioDeProducto;
