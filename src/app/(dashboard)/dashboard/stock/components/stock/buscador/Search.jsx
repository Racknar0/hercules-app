import React, { useMemo } from 'react'
import Spinner from '@admin-shared/spinner/Spinner'
import './Search.scss'
import useStore from '@store/useStore';

const Search = ({
  searchTerm,
  setSearchTerm,
  loadingProducts,
  visibleProducts,
  visibleProductsCount,
  totalProductsCount,
  hasMoreProducts,
  productsLoaderRef,
  loadMoreProducts,
  sortMode,
  setSortMode,
  selectedProduct,
  handleSelectProduct,
  openStockModal,
  loadingButtonStock
}) => {


  const role = useStore((state) => state.jwtData?.role);

  const renderProducts = useMemo(() => {
    const items = [...visibleProducts];
    const collator = new Intl.Collator('es', {
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true,
    });

    const normalizeName = (value) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    if (sortMode === 'alphabetical') {
      items.sort((left, right) => {
        const leftName = normalizeName(left?.name);
        const rightName = normalizeName(right?.name);

        const leftIsEmpty = leftName.length === 0;
        const rightIsEmpty = rightName.length === 0;

        if (leftIsEmpty !== rightIsEmpty) {
          return leftIsEmpty ? 1 : -1;
        }

        return collator.compare(leftName, rightName);
      });
    }

    if (sortMode === 'stockDesc') {
      items.sort(
        (left, right) => (right?.stockunit?.length || 0) - (left?.stockunit?.length || 0)
      );
    }

    return items;
  }, [sortMode, visibleProducts]);

  const getStockClass = (stock) => {
    if (!stock?.stockunit || !stock?.stockunit.length) return 'low'; // Si no hay stock
    const quantity = stock?.stockunit?.length; // Cantidad de unidades de stock
    if (quantity >= 10) return 'high';
    if (quantity >= 5) return 'medium';
    return 'low';
  }

  return (
      <div className="col-md-4 border-end buscador_container">
          {
              ['Admin'].includes(role) && (
                  <>
                  {
                    loadingButtonStock ? (
                      <div className='spinner_container_btn'> <Spinner color="#6564d8" /> </div>
                    ) : (
                      <button className="btn_modificar_stock" onClick={() => {openStockModal()}}>
                        🛠️ Modificar Stock
                      </button>
                    )
                  }
                </>
              )
          }
          
          <h5>📦 Listado de productos</h5>
          <input className="form-control mb-2 form_buscador" placeholder="🔎 Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {!loadingProducts && totalProductsCount > 0 && (
            <div className='list-status-row'>
              <div className='list-status'>Mostrando {visibleProductsCount} de {totalProductsCount}</div>
              <div className='list-actions'>
                <button
                  type='button'
                  className={`list-action-btn ${sortMode === 'stockDesc' ? 'active' : ''}`}
                  onClick={() => setSortMode((current) => current === 'stockDesc' ? 'default' : 'stockDesc')}
                >
                  📦⬇️ Stock
                </button>
              </div>
            </div>
          )}
          <ul className="list-group">
            {loadingProducts ? (
              <div className='spinner_container'> <Spinner color="#6564d8" /> </div>
            ) : renderProducts.length ? (
              <>
                {renderProducts.map((prod) => (
                  <li
                    key={prod.id}
                    className={`list-group-item list-group-item-action ${
                      selectedProduct?.id === prod.id ? 'active' : ''
                    }`}
                    onClick={() => handleSelectProduct(prod)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className='left'>
                      <p className='fw-bold'>{prod.name.charAt(0).toUpperCase() + prod.name.slice(1)}</p>
                      <p className='text'>Código: {prod.code.toUpperCase()}</p>
                      <p>{prod.category.name.charAt(0).toUpperCase() + prod.category.name.slice(1)}</p>
                    </div>
                    <div className='right'>
                      <div className={`color_stock ${getStockClass(prod)}`}>
                      </div>
                    </div>
                  </li>
                ))}

                {hasMoreProducts && (
                  <li className='list-group-item list-group-item-loader'>
                    <div ref={productsLoaderRef} className='list-loader-wrap'>
                      <button type='button' className='list-load-more-btn' onClick={loadMoreProducts}>
                        Cargar 20 más
                      </button>
                    </div>
                  </li>
                )}
              </>
            ) : (
              <li className="list-group-item">No se encontraron productos</li>
            )}
          </ul>
        </div>

  )
}

export default Search