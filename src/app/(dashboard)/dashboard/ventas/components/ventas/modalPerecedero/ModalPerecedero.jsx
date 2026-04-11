import React from 'react'
import PlusIcon from '@admin-shared/icons/PlusIcon';
import './ModalPerecedero.scss'
import useStore from '@store/useStore';

const ModalPerecedero = ({
    selectedProduct,
    setSelectedProduct,
    setProductData,
    setShowModal,
    productData,
    setLastAddedIndex
}) => {


    const cartItems = useStore((state) => state.cartItems);
    const setCartItems = useStore((state) => state.setCartItems);

    // Ordenar los productos por fecha de vencimiento más antigua
    if (selectedProduct && selectedProduct.stockunit) {
        selectedProduct.stockunit.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
    }

  return (
    <table className="table table-bordered mt-4 perecederos_table">
          <thead className="table-light">
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Precio</th>
              <th>Vencimiento</th>
              <th className="th_coupon_body" style={{ display: 'flex', justifyContent: 'center' }}>
                <PlusIcon width="20px" height="20px" />
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedProduct && selectedProduct.stockunit.length > 0 ? (
              selectedProduct.stockunit.map((item, index) => (
                <tr key={index}>
                  <td>{item.product.name}</td>
                  <td>{item.product.code}</td>
                  <td>{item.product.salePrice}</td>
                  <td>{new Date(item.expirationDate).toLocaleDateString()}</td>
                  <td className="text-center">
                    <button
                      className="btn_add"
                      onClick={() => {
                        // Añadir al carrito el stock unit seleccionado
                        // setCartItems((prev) => [...prev, item]);

                        // setCartItems(prev => {
                        //   const newIndex = prev.length;
                        //     setLastAddedIndex(newIndex);
                        //    // después de 1s, quita el highlight
                        //     setTimeout(() => setLastAddedIndex(null), 100);
                        //     return [...prev, item];
                        //  });

                        const cartUnit = {
                          ...item,                               // id, product, expirationDate, etc.
                          itemCoupon: null,                      // cupón propio (aún sin asignar)
                          priceWithItemCoupon: Number(item.product.salePrice), // precio “neto” inicial
                        };

                        // setCartItems([...cartItems, cartUnit]);  // ⬅️ahora push el OBJETO nuevo 


                        const newIndex = cartItems.length;          
                        setLastAddedIndex(newIndex);
                        setTimeout(() => setLastAddedIndex(null), 100);
                        setCartItems([...cartItems, cartUnit]);   


                        console.log('selectedProduct.stockunit', selectedProduct.stockunit);
                        // Remover el stock unit del producto perecedero
                        const updatedStockUnits = selectedProduct.stockunit.filter(
                          (unit) => unit.id !== item.id
                        );

                        console.log('updatedStockUnits', updatedStockUnits);

                        // Actualizar el selectedProduct.stockunit con updatedStockUnits
                        setSelectedProduct((prev) => ({
                          ...prev,
                          stockunit: updatedStockUnits,
                        }));




                        // Actualizar el productData con el producto actualizado
                        const updatedProductData = productData.map((p) =>
                          p.id === selectedProduct.id ? { ...p, stockunit: updatedStockUnits } : p
                        );
                        setProductData(updatedProductData);

                        // Cerrar el modal
                        setShowModal(false);
                       
                      }}
                    >
                      <PlusIcon width="20px" height="20px" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">
                  No hay productos disponibles. Selecciona uno a la izquierda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
  )
}

export default ModalPerecedero