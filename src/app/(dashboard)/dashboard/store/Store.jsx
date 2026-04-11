"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import HttpService from '@services/HttpService';
import useChunkedVirtualizedList from '@helpers/useChunkedVirtualizedList';
import productDefaultImg from '@assets/product_default.png';
import { getAssetSrc } from '@helpers/assetSrc';
import ZoomableImage from '@admin-shared/ZoomableImage/ZoomableImage';
import {
  confirmAlert,
  errorAlert,
  successAlert,
} from '@helpers/alerts';
import Spinner from '@admin-shared/spinner/Spinner';
import 'react-quill-new/dist/quill.snow.css';
import './Store.scss';

const RichTextEditor = dynamic(() => import('react-quill-new'), { ssr: false });

const MIN_NEAR_SQUARE_RATIO = 0.5;
const MAX_NEAR_SQUARE_RATIO = 1.5;

const NEWS_EDITOR_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

const NEWS_EDITOR_FORMATS = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'link',
  'blockquote',
];

const Store = () => {
  const httpService = new HttpService();
  const BACK_HOST = process.env.NEXT_PUBLIC_BACK_HOST;

  const [activeTab, setActiveTab] = useState('builder');

  const [sourceProducts, setSourceProducts] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [storeCategories, setStoreCategories] = useState([]);

  const [sourceSearch, setSourceSearch] = useState('');
  const [itemsSearch, setItemsSearch] = useState('');

  const [selectedSourceIds, setSelectedSourceIds] = useState([]);
  const [selectedStoreItem, setSelectedStoreItem] = useState(null);

  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingMove, setSavingMove] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const [favoriteBlockCategories, setFavoriteBlockCategories] = useState([]);
  const [favoriteCategoryProducts, setFavoriteCategoryProducts] = useState([]);
  const [favoriteCategoryDraftId, setFavoriteCategoryDraftId] = useState('');
  const [favoriteProductsSearch, setFavoriteProductsSearch] = useState('');
  const [selectedFavoriteCategoryId, setSelectedFavoriteCategoryId] = useState(null);
  const [selectedFavoriteProductIds, setSelectedFavoriteProductIds] = useState([]);
  const [loadingFavoriteCategories, setLoadingFavoriteCategories] = useState(false);
  const [loadingFavoriteProducts, setLoadingFavoriteProducts] = useState(false);
  const [savingFavoriteCategory, setSavingFavoriteCategory] = useState(false);
  const [savingFavoriteProducts, setSavingFavoriteProducts] = useState(false);

  const [highlightForm, setHighlightForm] = useState({
    title: '',
    description: '',
    discountLabel: '',
    isActive: true,
    existingImage: null,
    newImage: null,
  });
  const [loadingHighlightBlock, setLoadingHighlightBlock] = useState(false);
  const [savingHighlightBlock, setSavingHighlightBlock] = useState(false);

  const [newsItems, setNewsItems] = useState([]);
  const [newsSearch, setNewsSearch] = useState('');
  const [selectedNewsId, setSelectedNewsId] = useState(null);
  const [loadingNews, setLoadingNews] = useState(false);
  const [savingNews, setSavingNews] = useState(false);
  const [deletingNews, setDeletingNews] = useState(false);
  const [newsForm, setNewsForm] = useState({
    id: null,
    title: '',
    tag: '',
    descriptionHtml: '',
    isActive: true,
    existingImage: null,
    newImage: null,
  });

  const [categoryDraft, setCategoryDraft] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [form, setForm] = useState({
    alias: '',
    webPrice: '',
    compareAtPrice: '',
    shortDescription: '',
    longDescription: '',
    isPublished: false,
    categoryIds: [],
    existingGallery: [],
    newImages: [],
  });

  const loadSourceProducts = async () => {
    try {
      setLoadingSource(true);
      const response = await httpService.getData('/store-items/products-source');
      if (response.status === 200) {
        setSourceProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error loading source products:', error);
      errorAlert('Error', 'No se pudieron cargar los productos maestros');
    } finally {
      setLoadingSource(false);
    }
  };

  const loadStoreItems = async () => {
    try {
      setLoadingItems(true);
      const response = await httpService.getData('/store-items');
      if (response.status === 200) {
        setStoreItems(response.data || []);
      }
    } catch (error) {
      console.error('Error loading store items:', error);
      errorAlert('Error', 'No se pudieron cargar los items de tienda');
    } finally {
      setLoadingItems(false);
    }
  };

  const loadStoreCategories = async () => {
    try {
      const response = await httpService.getData('/store-items/categories');
      if (response.status === 200) {
        setStoreCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading store categories:', error);
      errorAlert('Error', 'No se pudieron cargar las categorias de tienda');
    }
  };

  const loadFavoriteBlockCategories = async (preferredCategoryId = null) => {
    try {
      setLoadingFavoriteCategories(true);
      const response = await httpService.getData('/store-items/favorites/categories');

      if (response.status === 200) {
        const categories = response.data || [];
        setFavoriteBlockCategories(categories);

        setSelectedFavoriteCategoryId((previousId) => {
          const candidateId = preferredCategoryId ?? previousId;
          const exists = categories.some((category) => category.id === candidateId);

          if (candidateId && exists) {
            return candidateId;
          }

          return categories[0]?.id || null;
        });
      }
    } catch (error) {
      console.error('Error loading favorite block categories:', error);
      errorAlert('Error', 'No se pudieron cargar las categorias del bloque favoritos');
    } finally {
      setLoadingFavoriteCategories(false);
    }
  };

  const loadFavoriteCategoryProducts = async (favoriteCategoryId) => {
    if (!favoriteCategoryId) {
      setFavoriteCategoryProducts([]);
      setSelectedFavoriteProductIds([]);
      return;
    }

    try {
      setLoadingFavoriteProducts(true);
      const response = await httpService.getData(`/store-items/favorites/categories/${favoriteCategoryId}/products`);

      if (response.status === 200) {
        const products = response.data?.products || [];
        setFavoriteCategoryProducts(products);
        setSelectedFavoriteProductIds(products.filter((product) => product.isSelected).map((product) => product.id));
      }
    } catch (error) {
      console.error('Error loading favorite category products:', error);
      errorAlert('Error', 'No se pudieron cargar los productos de la categoria favorita');
    } finally {
      setLoadingFavoriteProducts(false);
    }
  };

  const loadHighlightBlock = async () => {
    try {
      setLoadingHighlightBlock(true);
      const response = await httpService.getData('/store-items/highlight-block');

      if (response.status === 200) {
        const block = response.data || {};
        setHighlightForm((prev) => ({
          ...prev,
          title: block.title || '',
          description: block.description || '',
          discountLabel: block.discountLabel || '',
          isActive: block.isActive !== undefined ? Boolean(block.isActive) : true,
          existingImage: block.image || null,
          newImage: null,
        }));
      }
    } catch (error) {
      console.error('Error loading highlight block:', error);
      errorAlert('Error', 'No se pudo cargar la configuracion del bloque destacado');
    } finally {
      setLoadingHighlightBlock(false);
    }
  };

  const loadStoreNews = async (preferredNewsId = null) => {
    try {
      setLoadingNews(true);
      const response = await httpService.getData('/store-items/news');

      if (response.status === 200) {
        const items = response.data || [];
        setNewsItems(items);

        const resolvedSelectedId = preferredNewsId ?? selectedNewsId;
        const selectedItem = items.find((item) => item.id === resolvedSelectedId) || items[0] || null;

        if (selectedItem) {
          setSelectedNewsId(selectedItem.id);
          setNewsForm({
            id: selectedItem.id,
            title: selectedItem.title || '',
            tag: selectedItem.tag || '',
            descriptionHtml: selectedItem.descriptionHtml || '',
            isActive: Boolean(selectedItem.isActive),
            existingImage: selectedItem.image || null,
            newImage: null,
          });
        } else {
          setSelectedNewsId(null);
          setNewsForm({
            id: null,
            title: '',
            tag: '',
            descriptionHtml: '',
            isActive: true,
            existingImage: null,
            newImage: null,
          });
        }
      }
    } catch (error) {
      console.error('Error loading store news:', error);
      errorAlert('Error', 'No se pudieron cargar las noticias');
    } finally {
      setLoadingNews(false);
    }
  };

  const loadAll = async () => {
    await Promise.all([
      loadSourceProducts(),
      loadStoreItems(),
      loadStoreCategories(),
    ]);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    loadFavoriteCategoryProducts(selectedFavoriteCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedFavoriteCategoryId]);

  useEffect(() => {
    if (activeTab !== 'favorites') return;
    loadFavoriteBlockCategories(selectedFavoriteCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'highlight') return;
    loadHighlightBlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'news') return;
    loadStoreNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredSourceProducts = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase();

    return sourceProducts.filter((product) => {
      if (!term) return true;

      return (
        product.name?.toLowerCase().includes(term) ||
        product.code?.toLowerCase().includes(term) ||
        product.category?.name?.toLowerCase().includes(term)
      );
    });
  }, [sourceProducts, sourceSearch]);

  const filteredStoreItems = useMemo(() => {
    const term = itemsSearch.trim().toLowerCase();

    return storeItems.filter((item) => {
      if (!term) return true;

      return (
        item.alias?.toLowerCase().includes(term) ||
        item.product?.name?.toLowerCase().includes(term) ||
        item.product?.code?.toLowerCase().includes(term)
      );
    });
  }, [storeItems, itemsSearch]);

  const availableFavoriteCategoryOptions = useMemo(() => {
    const configuredCategoryIds = new Set(favoriteBlockCategories.map((category) => category.storeCategoryId));
    return storeCategories.filter((category) => !configuredCategoryIds.has(category.id));
  }, [favoriteBlockCategories, storeCategories]);

  const selectedFavoriteCategory = useMemo(() => {
    return favoriteBlockCategories.find((category) => category.id === selectedFavoriteCategoryId) || null;
  }, [favoriteBlockCategories, selectedFavoriteCategoryId]);

  const filteredFavoriteProducts = useMemo(() => {
    const term = favoriteProductsSearch.trim().toLowerCase();

    return favoriteCategoryProducts.filter((item) => {
      if (!term) return true;

      return (
        item.alias?.toLowerCase().includes(term) ||
        item.product?.name?.toLowerCase().includes(term) ||
        item.product?.code?.toLowerCase().includes(term)
      );
    });
  }, [favoriteCategoryProducts, favoriteProductsSearch]);

  const filteredNewsItems = useMemo(() => {
    const term = newsSearch.trim().toLowerCase();

    return newsItems.filter((item) => {
      if (!term) return true;

      return (
        item.title?.toLowerCase().includes(term) ||
        item.excerpt?.toLowerCase().includes(term) ||
        item.tag?.toLowerCase().includes(term)
      );
    });
  }, [newsItems, newsSearch]);

  const isItemUncategorized = useCallback((item) => {
    return !Array.isArray(item?.categories) || item.categories.length === 0;
  }, []);

  const draftStoreItems = useMemo(() => {
    return filteredStoreItems.filter((item) => !item.isPublished || isItemUncategorized(item));
  }, [filteredStoreItems, isItemUncategorized]);

  const draftItemsWithoutCategory = useMemo(() => {
    return draftStoreItems.filter((item) => isItemUncategorized(item));
  }, [draftStoreItems, isItemUncategorized]);

  const draftItemsWithCategory = useMemo(() => {
    return draftStoreItems.filter((item) => !isItemUncategorized(item));
  }, [draftStoreItems, isItemUncategorized]);

  const publishedByCategory = useMemo(() => {
    const publishedItems = filteredStoreItems.filter((item) => item.isPublished && !isItemUncategorized(item));

    return storeCategories
      .map((category) => ({
        category,
        items: publishedItems.filter((item) => item.categories.some((itemCategory) => itemCategory.id === category.id)),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredStoreItems, isItemUncategorized, storeCategories]);

  const newImagePreviews = useMemo(() => {
    return form.newImages.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  }, [form.newImages]);

  const highlightImagePreview = useMemo(() => {
    if (!highlightForm.newImage) return null;
    return URL.createObjectURL(highlightForm.newImage);
  }, [highlightForm.newImage]);

  const newsImagePreview = useMemo(() => {
    if (!newsForm.newImage) return null;
    return URL.createObjectURL(newsForm.newImage);
  }, [newsForm.newImage]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [newImagePreviews]);

  useEffect(() => {
    return () => {
      if (highlightImagePreview) {
        URL.revokeObjectURL(highlightImagePreview);
      }
    };
  }, [highlightImagePreview]);

  useEffect(() => {
    return () => {
      if (newsImagePreview) {
        URL.revokeObjectURL(newsImagePreview);
      }
    };
  }, [newsImagePreview]);

  const {
    visibleItems: visibleSourceProducts,
    visibleCount: visibleSourceCount,
    totalCount: totalSourceCount,
    hasMore: hasMoreSourceProducts,
    loaderRef: sourceLoaderRef,
    loadMore: loadMoreSourceProducts,
  } = useChunkedVirtualizedList(filteredSourceProducts, {
    batchSize: 20,
    resetKey: `${sourceSearch}|${filteredSourceProducts.length}`,
  });

  const handleToggleSourceProduct = (productId) => {
    setSelectedSourceIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleMoveToStore = async () => {
    if (selectedSourceIds.length === 0) {
      errorAlert('Seleccion vacia', 'Debes seleccionar al menos un producto');
      return;
    }

    const confirm = await confirmAlert(
      'Crear items de tienda',
      `Se crearan ${selectedSourceIds.length} items de tienda. Deseas continuar?`,
      'question'
    );

    if (!confirm) return;

    try {
      setSavingMove(true);
      const response = await httpService.postData('/store-items/bulk-create', {
        productIds: selectedSourceIds,
      });

      if (response.status === 200 || response.status === 201) {
        successAlert('Items creados', response.data.message || 'Operacion exitosa');
        setSelectedSourceIds([]);
        await Promise.all([loadSourceProducts(), loadStoreItems()]);
      } else {
        errorAlert('Error', 'No se pudieron crear los items de tienda');
      }
    } catch (error) {
      console.error('Error creating store items:', error);
      const message = error?.response?.data?.message || 'No se pudieron crear los items de tienda';
      errorAlert('Error', message);
    } finally {
      setSavingMove(false);
    }
  };

  const handlePickStoreItem = (item) => {
    const existingGallery = Array.isArray(item.gallery) && item.gallery.length > 0
      ? item.gallery
      : item.image
        ? [item.image]
        : [];

    setSelectedStoreItem(item);
    setForm({
      alias: item.alias || '',
      webPrice: item.webPrice ?? '',
      compareAtPrice: item.compareAtPrice ?? '',
      shortDescription: item.shortDescription || '',
      longDescription: item.longDescription || '',
      isPublished: Boolean(item.isPublished),
      categoryIds: item.categories?.map((category) => category.id) || [],
      existingGallery,
      newImages: [],
    });
  };

  const getMediaSrc = (mediaPath) => {
    if (!mediaPath) return getAssetSrc(productDefaultImg);
    if (/^https?:\/\//i.test(mediaPath)) return mediaPath;
    return `${BACK_HOST}/${mediaPath}`;
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      existingGallery: prev.existingGallery.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleAppendNewImages = (files) => {
    const selectedFiles = Array.from(files || []).filter(Boolean);
    if (selectedFiles.length === 0) return;

    const validateSquareImage = (file) => {
      return new Promise((resolve) => {
        if (!file.type?.startsWith('image/')) {
          resolve({ file, valid: false });
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
          const ratio = image.naturalWidth / image.naturalHeight;
          const isNearSquare = ratio >= MIN_NEAR_SQUARE_RATIO && ratio <= MAX_NEAR_SQUARE_RATIO;
          URL.revokeObjectURL(previewUrl);
          resolve({ file, valid: isNearSquare });
        };

        image.onerror = () => {
          URL.revokeObjectURL(previewUrl);
          resolve({ file, valid: false });
        };

        image.src = previewUrl;
      });
    };

    Promise.all(selectedFiles.map(validateSquareImage)).then((results) => {
      const validFiles = results.filter((result) => result.valid).map((result) => result.file);
      const invalidCount = results.length - validFiles.length;

      if (invalidCount > 0) {
        errorAlert(
          'Formato no permitido',
          'Las imagenes no deben ser tan rectangulares. Deben ser lo mas cuadradas posible (cercanas a 1:1).'
        );
      }

      if (validFiles.length === 0) return;

      setForm((prev) => ({
        ...prev,
        newImages: [...prev.newImages, ...validFiles],
      }));
    });
  };

  const handleRemoveNewImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSaveStoreItem = async (e) => {
    e.preventDefault();

    if (!selectedStoreItem) {
      errorAlert('Seleccion requerida', 'Debes elegir un item para editar');
      return;
    }

    const alias = form.alias.trim();
    const shortDescription = form.shortDescription.trim();
    const longDescription = form.longDescription.trim();
    const selectedCategories = Array.isArray(form.categoryIds) ? form.categoryIds : [];
    const totalImages = (form.existingGallery?.length || 0) + (form.newImages?.length || 0);

    if (!alias) {
      errorAlert('Dato requerido', 'El alias es obligatorio');
      return;
    }

    if (form.webPrice === '' || Number(form.webPrice) <= 0) {
      errorAlert('Dato requerido', 'El precio web debe ser valido');
      return;
    }

    if (selectedCategories.length === 0) {
      errorAlert('Dato requerido', 'Debes seleccionar al menos una categoria de tienda');
      return;
    }

    if (!shortDescription) {
      errorAlert('Dato requerido', 'La descripcion corta es obligatoria');
      return;
    }

    if (!longDescription) {
      errorAlert('Dato requerido', 'La descripcion larga es obligatoria');
      return;
    }

    if (totalImages === 0) {
      errorAlert('Dato requerido', 'Debes anexar al menos una imagen');
      return;
    }

    const payload = new FormData();
    payload.append('alias', alias);
    payload.append('webPrice', String(form.webPrice));
    payload.append('compareAtPrice', form.compareAtPrice === '' ? '' : String(form.compareAtPrice));
    payload.append('shortDescription', shortDescription);
    payload.append('longDescription', longDescription);
    payload.append('isPublished', String(form.isPublished));
    payload.append('categoryIds', JSON.stringify(selectedCategories));
    payload.append('remainingGallery', JSON.stringify(form.existingGallery));

    form.newImages.forEach((imageFile) => {
      payload.append('storeImages', imageFile);
    });

    try {
      setSavingItem(true);
      const response = await httpService.putFormData('/store-items', selectedStoreItem.id, payload);

      if (response.status === 200) {
        successAlert('Item actualizado', 'El item de tienda se actualizo correctamente');
        await Promise.all([loadStoreItems(), loadSourceProducts()]);

        const refreshedItem = response.data?.storeItem;
        if (refreshedItem?.id) {
          handlePickStoreItem(refreshedItem);
        }
      } else {
        errorAlert('Error', 'No se pudo actualizar el item de tienda');
      }
    } catch (error) {
      console.error('Error updating store item:', error);
      const message = error?.response?.data?.message || 'No se pudo actualizar el item de tienda';
      errorAlert('Error', message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryDraft.trim()) {
      errorAlert('Dato requerido', 'El nombre de la categoria es obligatorio');
      return;
    }

    try {
      setSavingCategory(true);

      if (editingCategoryId) {
        await httpService.putData('/store-items/categories', editingCategoryId, {
          name: categoryDraft.trim(),
        });
        successAlert('Categoria actualizada', 'La categoria se actualizo correctamente');
      } else {
        await httpService.postData('/store-items/categories', {
          name: categoryDraft.trim(),
        });
        successAlert('Categoria creada', 'La categoria se creo correctamente');
      }

      setCategoryDraft('');
      setEditingCategoryId(null);
      await Promise.all([
        loadStoreCategories(),
        loadFavoriteBlockCategories(selectedFavoriteCategoryId),
      ]);
    } catch (error) {
      console.error('Error saving store category:', error);
      const message = error?.response?.data?.message || 'No se pudo guardar la categoria';
      errorAlert('Error', message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryDraft(category.name);
  };

  const handleDeleteCategory = async (category) => {
    const confirm = await confirmAlert(
      'Eliminar categoria',
      `Se eliminara la categoria ${category.name}. Deseas continuar?`,
      'warning'
    );

    if (!confirm) return;

    try {
      await httpService.deleteData('/store-items/categories', category.id);
      successAlert('Categoria eliminada', 'La categoria fue eliminada correctamente');
      await Promise.all([
        loadStoreCategories(),
        loadStoreItems(),
        loadFavoriteBlockCategories(selectedFavoriteCategoryId),
      ]);
    } catch (error) {
      console.error('Error deleting store category:', error);
      const message = error?.response?.data?.message || 'No se pudo eliminar la categoria';
      errorAlert('Error', message);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryDraft('');
  };

  const handleAddFavoriteCategory = async () => {
    const storeCategoryId = Number(favoriteCategoryDraftId);

    if (!Number.isInteger(storeCategoryId) || storeCategoryId <= 0) {
      errorAlert('Dato requerido', 'Debes seleccionar una categoria de tienda para favoritos');
      return;
    }

    try {
      setSavingFavoriteCategory(true);
      const response = await httpService.postData('/store-items/favorites/categories', {
        storeCategoryId,
      });

      if (response.status === 201 || response.status === 200) {
        const createdFavoriteCategoryId = response.data?.favoriteCategory?.id || null;
        successAlert('Categoria agregada', 'La categoria se agrego al bloque favoritos');
        setFavoriteCategoryDraftId('');
        await loadFavoriteBlockCategories(createdFavoriteCategoryId);
      } else {
        errorAlert('Error', 'No se pudo agregar la categoria a favoritos');
      }
    } catch (error) {
      console.error('Error creating favorite block category:', error);
      const message = error?.response?.data?.message || 'No se pudo agregar la categoria a favoritos';
      errorAlert('Error', message);
    } finally {
      setSavingFavoriteCategory(false);
    }
  };

  const handleDeleteFavoriteCategory = async (favoriteCategory) => {
    const confirm = await confirmAlert(
      'Quitar categoria de favoritos',
      `Se quitara ${favoriteCategory?.category?.name || 'la categoria seleccionada'} del bloque favoritos. Deseas continuar?`,
      'warning'
    );

    if (!confirm) return;

    try {
      await httpService.deleteData('/store-items/favorites/categories', favoriteCategory.id);
      successAlert('Categoria eliminada', 'La categoria se elimino del bloque favoritos');
      await loadFavoriteBlockCategories();
    } catch (error) {
      console.error('Error deleting favorite block category:', error);
      const message = error?.response?.data?.message || 'No se pudo eliminar la categoria de favoritos';
      errorAlert('Error', message);
    }
  };

  const handleToggleFavoriteProduct = (storeItemId) => {
    setSelectedFavoriteProductIds((previousIds) => {
      if (previousIds.includes(storeItemId)) {
        return previousIds.filter((id) => id !== storeItemId);
      }

      return [...previousIds, storeItemId];
    });
  };

  const handleSaveFavoriteProducts = async () => {
    if (!selectedFavoriteCategoryId) {
      errorAlert('Dato requerido', 'Debes seleccionar una categoria del bloque favoritos');
      return;
    }

    try {
      setSavingFavoriteProducts(true);

      const response = await httpService.patchData(
        `/store-items/favorites/categories/${selectedFavoriteCategoryId}/products`,
        { storeItemIds: selectedFavoriteProductIds }
      );

      if (response.status === 200) {
        successAlert('Favoritos actualizados', 'La seleccion de productos favoritos se guardo correctamente');

        await Promise.all([
          loadFavoriteBlockCategories(selectedFavoriteCategoryId),
          loadFavoriteCategoryProducts(selectedFavoriteCategoryId),
        ]);
      } else {
        errorAlert('Error', 'No se pudo guardar la seleccion de favoritos');
      }
    } catch (error) {
      console.error('Error updating favorite block products:', error);
      const message = error?.response?.data?.message || 'No se pudo guardar la seleccion de favoritos';
      errorAlert('Error', message);
    } finally {
      setSavingFavoriteProducts(false);
    }
  };

  const handleHighlightImageChange = (file) => {
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      errorAlert('Formato no permitido', 'Debes seleccionar una imagen valida para el bloque destacado');
      return;
    }

    setHighlightForm((prev) => ({
      ...prev,
      newImage: file,
    }));
  };

  const handleRemoveHighlightImage = () => {
    setHighlightForm((prev) => ({
      ...prev,
      existingImage: null,
      newImage: null,
    }));
  };

  const handleSaveHighlightBlock = async (e) => {
    e.preventDefault();

    const title = highlightForm.title.trim();
    const description = highlightForm.description.trim();
    const discountLabel = highlightForm.discountLabel.trim();
    const hasImage = Boolean(highlightForm.newImage || highlightForm.existingImage);

    if (!title) {
      errorAlert('Dato requerido', 'El titulo del bloque destacado es obligatorio');
      return;
    }

    if (!description) {
      errorAlert('Dato requerido', 'La descripcion del bloque destacado es obligatoria');
      return;
    }

    if (!hasImage) {
      errorAlert('Dato requerido', 'Debes anexar una imagen para el bloque destacado');
      return;
    }

    const payload = new FormData();
    payload.append('title', title);
    payload.append('description', description);
    payload.append('discountLabel', discountLabel);
    payload.append('isActive', String(highlightForm.isActive));
    payload.append('keepCurrentImage', String(Boolean(highlightForm.existingImage && !highlightForm.newImage)));

    if (highlightForm.newImage) {
      payload.append('highlightImage', highlightForm.newImage);
    }

    try {
      setSavingHighlightBlock(true);
      const response = await httpService.patchData('/store-items/highlight-block', payload);

      if (response.status === 200) {
        const savedBlock = response.data?.highlightBlock || {};
        successAlert('Bloque actualizado', 'El bloque destacado se actualizo correctamente');

        setHighlightForm((prev) => ({
          ...prev,
          title: savedBlock.title || title,
          description: savedBlock.description || description,
          discountLabel: savedBlock.discountLabel || '',
          isActive: savedBlock.isActive !== undefined ? Boolean(savedBlock.isActive) : prev.isActive,
          existingImage: savedBlock.image || null,
          newImage: null,
        }));
      } else {
        errorAlert('Error', 'No se pudo guardar el bloque destacado');
      }
    } catch (error) {
      console.error('Error updating highlight block:', error);
      const message = error?.response?.data?.message || 'No se pudo guardar el bloque destacado';
      errorAlert('Error', message);
    } finally {
      setSavingHighlightBlock(false);
    }
  };

  const handleCreateNewsDraft = () => {
    setSelectedNewsId(null);
    setNewsForm({
      id: null,
      title: '',
      tag: '',
      descriptionHtml: '',
      isActive: true,
      existingImage: null,
      newImage: null,
    });
  };

  const handleSelectNews = (item) => {
    setSelectedNewsId(item.id);
    setNewsForm({
      id: item.id,
      title: item.title || '',
      tag: item.tag || '',
      descriptionHtml: item.descriptionHtml || '',
      isActive: Boolean(item.isActive),
      existingImage: item.image || null,
      newImage: null,
    });
  };

  const handleNewsImageChange = (file) => {
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      errorAlert('Formato no permitido', 'Debes seleccionar una imagen valida para la noticia');
      return;
    }

    setNewsForm((prev) => ({
      ...prev,
      newImage: file,
    }));
  };

  const handleRemoveNewsImage = () => {
    setNewsForm((prev) => ({
      ...prev,
      existingImage: null,
      newImage: null,
    }));
  };

  const handleSaveNews = async (e) => {
    e.preventDefault();

    const title = newsForm.title.trim();
    const tag = newsForm.tag.trim();
    const descriptionHtml = newsForm.descriptionHtml || '';
    const descriptionText = descriptionHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const hasImage = Boolean(newsForm.newImage || newsForm.existingImage);

    if (!title) {
      errorAlert('Dato requerido', 'El titulo de la noticia es obligatorio');
      return;
    }

    if (!descriptionText) {
      errorAlert('Dato requerido', 'La descripcion de la noticia es obligatoria');
      return;
    }

    if (!hasImage) {
      errorAlert('Dato requerido', 'Debes anexar una imagen para la noticia');
      return;
    }

    const payload = new FormData();
    payload.append('title', title);
    payload.append('tag', tag);
    payload.append('descriptionHtml', descriptionHtml);
    payload.append('isActive', String(newsForm.isActive));
    payload.append('keepCurrentImage', String(Boolean(newsForm.existingImage && !newsForm.newImage)));

    if (newsForm.newImage) {
      payload.append('newsImage', newsForm.newImage);
    }

    try {
      setSavingNews(true);

      let response;
      if (newsForm.id) {
        response = await httpService.putFormData('/store-items/news', newsForm.id, payload);
      } else {
        response = await httpService.postFormData('/store-items/news', payload);
      }

      if (response.status === 200 || response.status === 201) {
        const savedId = response.data?.news?.id || null;
        successAlert('Noticia guardada', 'La noticia se guardo correctamente');
        await loadStoreNews(savedId);
      } else {
        errorAlert('Error', 'No se pudo guardar la noticia');
      }
    } catch (error) {
      console.error('Error saving news:', error);
      const message = error?.response?.data?.message || 'No se pudo guardar la noticia';
      errorAlert('Error', message);
    } finally {
      setSavingNews(false);
    }
  };

  const handleDeleteSelectedNews = async () => {
    if (!newsForm.id) {
      errorAlert('Seleccion requerida', 'Debes seleccionar una noticia para eliminar');
      return;
    }

    const confirm = await confirmAlert(
      'Eliminar noticia',
      'La noticia seleccionada se eliminara. Deseas continuar?',
      'warning'
    );

    if (!confirm) return;

    try {
      setDeletingNews(true);
      await httpService.deleteData('/store-items/news', newsForm.id);
      successAlert('Noticia eliminada', 'La noticia fue eliminada correctamente');
      await loadStoreNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      const message = error?.response?.data?.message || 'No se pudo eliminar la noticia';
      errorAlert('Error', message);
    } finally {
      setDeletingNews(false);
    }
  };

  const getStoreItemPrimaryImage = (item) => {
    if (item?.image) return item.image;
    if (Array.isArray(item?.gallery) && item.gallery.length > 0) return item.gallery[0];
    return null;
  };

  const shouldShowItemPreview = (item) => {
    return Boolean(item?.isPublished || getStoreItemPrimaryImage(item));
  };

  const getItemStatusBadge = (item) => {
    if (isItemUncategorized(item)) {
      return { className: 'bg-danger', label: 'Sin categoria' };
    }

    if (item.isPublished) {
      return { className: 'bg-success', label: 'Publicado' };
    }

    return { className: 'bg-warning text-dark', label: 'Borrador' };
  };

  const renderStoreItemButton = (item) => {
    const statusBadge = getItemStatusBadge(item);

    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        aria-pressed={selectedStoreItem?.id === item.id}
        className={`store_list_item btn_like ${selectedStoreItem?.id === item.id ? 'is-selected' : ''}`}
        onClick={() => handlePickStoreItem(item)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePickStoreItem(item);
          }
        }}
      >
        <div className="store_item_main">
          {shouldShowItemPreview(item) && (
            <ZoomableImage
              src={getMediaSrc(getStoreItemPrimaryImage(item))}
              alt={item.alias || item.product?.name || 'Item de tienda'}
              thumbnailWidth={42}
              thumbnailHeight={42}
            />
          )}

          <div>
            <p className="store_list_title">{item.alias}</p>
            <p className="store_list_subtitle">
              {item.product?.code} | ${item.webPrice}
              {isItemUncategorized(item) ? ' | Requiere categoria para publicar' : ''}
            </p>
          </div>
        </div>
        <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
      </div>
    );
  };

  return (
    <div className="store_main_container">
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'builder' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('builder');
            }}
          >
            <span>⬅ ➡</span> Crear Items
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('categories');
            }}
          >
            <span>🏷</span> Categorias de Tienda
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('favorites');
            }}
          >
            <span>⭐</span> Bloque Favoritos
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'highlight' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('highlight');
            }}
          >
            <span>🔥</span> Bloque Destacado
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('news');
            }}
          >
            <span>📰</span> Noticias
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'manager' ? 'active' : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('manager');
            }}
          >
            <span>🛍</span> Gestionar Tienda
          </a>
        </li>
      </ul>

      <div className="tab-content mt-3">
        {activeTab === 'builder' && (
          <div className="store_builder_grid">
            <section className="store_card">
              <h3>Productos maestros</h3>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar por nombre, codigo o categoria"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
              />

              {!loadingSource && totalSourceCount > 0 && (
                <div className="store_virtual_hint">
                  Mostrando {visibleSourceCount} de {totalSourceCount} productos
                </div>
              )}

              {loadingSource ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <div className="store_list">
                  {visibleSourceProducts.map((product) => {
                    const isSelected = selectedSourceIds.includes(product.id);
                    const alreadyInStore = Boolean(product.storeItem);
                    const imageSrc = product.image
                      ? `${BACK_HOST}/${product.image}`
                      : getAssetSrc(productDefaultImg);

                    return (
                      <label key={product.id} className={`store_list_item ${alreadyInStore ? 'is-disabled' : ''}`}>
                        <div className="store_source_main">
                          <div className="store_source_left">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={alreadyInStore}
                              onChange={() => handleToggleSourceProduct(product.id)}
                            />
                            <ZoomableImage
                              src={imageSrc}
                              alt={product.name || 'Producto'}
                              thumbnailWidth={48}
                              thumbnailHeight={48}
                            />
                          </div>

                          <div className="store_source_meta">
                            {alreadyInStore && <span className="badge bg-secondary store_created_chip">Ya creado</span>}
                            <p className="store_list_title">{product.name}</p>
                            <p className="store_list_subtitle">{product.code} | {product.category?.name || 'Sin categoria'}</p>
                            <p className="store_source_prices">
                              Compra: ${product.purchasePrice} | Venta: ${product.salePrice}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}

                  {hasMoreSourceProducts && (
                    <div ref={sourceLoaderRef} className="store_load_more_container">
                      <button
                        type="button"
                        className="store_load_more_btn"
                        onClick={loadMoreSourceProducts}
                      >
                        Cargar 20 productos mas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="store_move_actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleMoveToStore}
                disabled={savingMove || selectedSourceIds.length === 0}
              >
                {savingMove ? 'Creando...' : 'Mover ➜'}
              </button>
              <p>{selectedSourceIds.length} seleccionados</p>
            </section>

            <section className="store_card">
              <h3>Items de tienda creados</h3>
              {loadingItems ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <div className="store_list">
                  {storeItems.map((item) => (
                    <div key={item.id} className="store_list_item no-pointer">
                      <div>
                        <p className="store_list_title">{item.alias}</p>
                        <p className="store_list_subtitle">{item.product?.name} | ${item.webPrice}</p>
                      </div>
                      <span className={`badge ${item.isPublished ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {item.isPublished ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="store_categories_grid">
            <section className="store_card">
              <h3>Categorias de tienda</h3>
              <div className="category_editor">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre de categoria"
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveCategory}
                  disabled={savingCategory}
                >
                  {editingCategoryId ? 'Actualizar' : 'Crear'}
                </button>
                {editingCategoryId && (
                  <button type="button" className="btn btn-outline-secondary" onClick={resetCategoryForm}>
                    Cancelar
                  </button>
                )}
              </div>

              <div className="store_list mt-3">
                {storeCategories.map((category) => (
                  <div key={category.id} className="store_list_item no-pointer">
                    <div>
                      <p className="store_list_title">{category.name}</p>
                      <p className="store_list_subtitle">/{category.slug}</p>
                    </div>
                    <div className="row_actions">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEditCategory(category)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(category)}>
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="store_favorites_grid">
            <section className="store_card">
              <h3>Configurar bloque favoritos</h3>
              <small className="store_hint_text">
                Selecciona las categorias que apareceran como filtros en el bloque &quot;Favoritos de nuestros clientes&quot;.
              </small>

              <div className="favorite_category_editor mt-2">
                <select
                  className="form-select"
                  value={favoriteCategoryDraftId}
                  onChange={(e) => setFavoriteCategoryDraftId(e.target.value)}
                >
                  <option value="">Selecciona una categoria de tienda</option>
                  {availableFavoriteCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddFavoriteCategory}
                  disabled={savingFavoriteCategory || availableFavoriteCategoryOptions.length === 0}
                >
                  {savingFavoriteCategory ? 'Agregando...' : 'Agregar'}
                </button>
              </div>

              {loadingFavoriteCategories ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <div className="store_list mt-3">
                  {favoriteBlockCategories.length === 0 ? (
                    <p className="store_gallery_empty">No has configurado categorias para el bloque favoritos.</p>
                  ) : (
                    favoriteBlockCategories.map((favoriteCategory) => {
                      const isSelected = selectedFavoriteCategoryId === favoriteCategory.id;

                      return (
                        <div key={favoriteCategory.id} className={`store_list_item no-pointer ${isSelected ? 'is-selected-favorite' : ''}`}>
                          <div>
                            <p className="store_list_title">{favoriteCategory.category?.name}</p>
                            <p className="store_list_subtitle">
                              /{favoriteCategory.category?.slug} | {favoriteCategory.selectedItemsCount} productos seleccionados
                            </p>
                          </div>

                          <div className="row_actions">
                            <button
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setSelectedFavoriteCategoryId(favoriteCategory.id)}
                            >
                              {isSelected ? 'Activa' : 'Seleccionar'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteFavoriteCategory(favoriteCategory)}
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </section>

            <section className="store_card">
              <h3>Seleccionar productos favoritos</h3>

              {!selectedFavoriteCategory ? (
                <p className="text-muted">Selecciona primero una categoria del bloque favoritos para listar sus productos.</p>
              ) : (
                <>
                  <div className="store_favorites_header">
                    <div>
                      <p className="store_list_title mb-0">Categoria activa: {selectedFavoriteCategory.category?.name}</p>
                      <p className="store_list_subtitle mb-0">
                        Solo se muestran items publicados que pertenecen a esta categoria.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSaveFavoriteProducts}
                      disabled={savingFavoriteProducts || loadingFavoriteProducts}
                    >
                      {savingFavoriteProducts ? 'Guardando...' : 'Guardar seleccion'}
                    </button>
                  </div>

                  <input
                    type="text"
                    className="form-control my-3"
                    placeholder="Buscar producto por alias, nombre o codigo"
                    value={favoriteProductsSearch}
                    onChange={(e) => setFavoriteProductsSearch(e.target.value)}
                  />

                  {loadingFavoriteProducts ? (
                    <div className="centered_spinner">
                      <Spinner color="#6564d8" />
                    </div>
                  ) : (
                    <div className="store_list">
                      {filteredFavoriteProducts.length === 0 ? (
                        <p className="store_gallery_empty">
                          No hay items publicados para esta categoria o no coinciden con la busqueda.
                        </p>
                      ) : (
                        filteredFavoriteProducts.map((item) => {
                          const checked = selectedFavoriteProductIds.includes(item.id);

                          return (
                            <label key={item.id} className="store_list_item">
                              <div className="store_source_main">
                                <div className="store_source_left">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleFavoriteProduct(item.id)}
                                  />
                                  <ZoomableImage
                                    src={getMediaSrc(getStoreItemPrimaryImage(item))}
                                    alt={item.alias || item.product?.name || 'Item favorito'}
                                    thumbnailWidth={48}
                                    thumbnailHeight={48}
                                  />
                                </div>

                                <div className="store_source_meta">
                                  <p className="store_list_title">{item.alias}</p>
                                  <p className="store_list_subtitle">
                                    {item.product?.name} | {item.product?.code}
                                  </p>
                                  <p className="store_source_prices">
                                    ${item.webPrice} | {item.categories?.map((category) => category.name).join(', ')}
                                  </p>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === 'highlight' && (
          <div className="store_highlight_grid">
            <section className="store_card store_editor_card">
              <h3>Configurar bloque destacado</h3>
              <small className="store_hint_text">
                Este bloque se usara despues en Home para destacar una promocion o producto clave.
              </small>

              {loadingHighlightBlock ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <form onSubmit={handleSaveHighlightBlock} className="mt-3">
                  <div className="mb-2 form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={highlightForm.isActive}
                      onChange={(e) => setHighlightForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label className="form-check-label">Bloque activo</label>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Descuento</label>
                    <input
                      className="form-control"
                      placeholder="Ej: -30% OFF"
                      value={highlightForm.discountLabel}
                      onChange={(e) => setHighlightForm((prev) => ({ ...prev, discountLabel: e.target.value }))}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Titulo</label>
                    <input
                      className="form-control"
                      placeholder="Titulo principal del bloque"
                      value={highlightForm.title}
                      onChange={(e) => setHighlightForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Descripcion</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Describe lo que se destacara en el Home"
                      value={highlightForm.description}
                      onChange={(e) => setHighlightForm((prev) => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Imagen destacada</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => {
                        handleHighlightImageChange(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {(highlightImagePreview || highlightForm.existingImage) && (
                    <div className="store_highlight_preview mt-2">
                      <ZoomableImage
                        src={highlightImagePreview || getMediaSrc(highlightForm.existingImage)}
                        alt="Imagen bloque destacado"
                        thumbnailWidth={140}
                        thumbnailHeight={140}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveHighlightImage}
                      >
                        Quitar imagen
                      </button>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary mt-3" disabled={savingHighlightBlock}>
                    {savingHighlightBlock ? 'Guardando...' : 'Guardar bloque destacado'}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="store_news_grid">
            <section className="store_card">
              <h3>Listado de noticias</h3>

              <div className="store_news_actions mb-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateNewsDraft}>
                  + Nueva noticia
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDeleteSelectedNews}
                  disabled={!newsForm.id || deletingNews}
                >
                  {deletingNews ? 'Eliminando...' : 'Eliminar seleccionada'}
                </button>
              </div>

              <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar noticia por titulo"
                value={newsSearch}
                onChange={(e) => setNewsSearch(e.target.value)}
              />

              {loadingNews ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <div className="store_list">
                  {filteredNewsItems.length === 0 ? (
                    <p className="store_gallery_empty">No hay noticias registradas.</p>
                  ) : (
                    filteredNewsItems.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedNewsId === item.id}
                        className={`store_list_item btn_like ${selectedNewsId === item.id ? 'is-selected-news' : ''}`}
                        onClick={() => handleSelectNews(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectNews(item);
                          }
                        }}
                      >
                        <div className="store_item_main">
                          {item.image && (
                            <ZoomableImage
                              src={getMediaSrc(item.image)}
                              alt={item.title || 'Noticia'}
                              thumbnailWidth={44}
                              thumbnailHeight={44}
                            />
                          )}
                          <div>
                            <p className="store_list_title">{item.title}</p>
                            {item.tag && <span className="badge bg-info text-dark store_news_tag_chip">#{item.tag}</span>}
                            <p className="store_list_subtitle">{item.excerpt || 'Sin descripcion'}</p>
                          </div>
                        </div>
                        <span className={`badge store_news_status_chip ${item.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {item.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            <section className="store_card store_editor_card">
              <h3>{newsForm.id ? 'Editar noticia' : 'Crear noticia'}</h3>

              <form onSubmit={handleSaveNews}>
                <div className="mb-2 form-check d-flex align-items-center gap-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={newsForm.isActive}
                    onChange={(e) => setNewsForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label className="form-check-label">Noticia activa</label>
                </div>

                <div className="mb-2">
                  <label className="form-label">Titulo</label>
                  <input
                    className="form-control"
                    placeholder="Titulo de la noticia"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Tag</label>
                  <input
                    className="form-control"
                    placeholder="Ej: promociones, salud, eventos"
                    value={newsForm.tag}
                    onChange={(e) => setNewsForm((prev) => ({ ...prev, tag: e.target.value }))}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label">Descripcion (HTML con formato)</label>
                  <div className="store_news_editor">
                    <RichTextEditor
                      theme="snow"
                      value={newsForm.descriptionHtml}
                      onChange={(value) => setNewsForm((prev) => ({ ...prev, descriptionHtml: value }))}
                      modules={NEWS_EDITOR_MODULES}
                      formats={NEWS_EDITOR_FORMATS}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Imagen de noticia</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      handleNewsImageChange(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>

                {(newsImagePreview || newsForm.existingImage) && (
                  <div className="store_highlight_preview mt-2">
                    <ZoomableImage
                      src={newsImagePreview || getMediaSrc(newsForm.existingImage)}
                      alt="Imagen noticia"
                      thumbnailWidth={140}
                      thumbnailHeight={140}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleRemoveNewsImage}
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}

                <button type="submit" className="btn btn-primary mt-3" disabled={savingNews}>
                  {savingNews ? 'Guardando...' : newsForm.id ? 'Actualizar noticia' : 'Crear noticia'}
                </button>
              </form>
            </section>
          </div>
        )}

        {activeTab === 'manager' && (
          <div className="store_manager_grid">
            <section className="store_card">
              <h3>Items de tienda</h3>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar item de tienda"
                value={itemsSearch}
                onChange={(e) => setItemsSearch(e.target.value)}
              />

              {loadingItems ? (
                <div className="centered_spinner">
                  <Spinner color="#6564d8" />
                </div>
              ) : (
                <div className="store_manager_sections">
                  <div className="store_manager_block">
                    <h4 className="store_block_title">Borradores</h4>

                    {draftStoreItems.length === 0 ? (
                      <p className="store_gallery_empty">No hay borradores.</p>
                    ) : (
                      <>
                        <div className="store_list">
                          {draftItemsWithCategory.map((item) => renderStoreItemButton(item))}
                        </div>

                        <div className="store_subsection mt-3">
                          <h5 className="store_subsection_title">Sin categoria</h5>
                          {draftItemsWithoutCategory.length === 0 ? (
                            <p className="store_gallery_empty">No hay items sin categoria.</p>
                          ) : (
                            <div className="store_list">
                              {draftItemsWithoutCategory.map((item) => renderStoreItemButton(item))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="store_manager_block mt-3">
                    <h4 className="store_block_title">Publicados por categoria</h4>
                    {publishedByCategory.length === 0 ? (
                      <p className="store_gallery_empty">No hay items publicados por categoria.</p>
                    ) : (
                      publishedByCategory.map((group) => (
                        <div key={group.category.id} className="store_subsection">
                          <h5 className="store_subsection_title">{group.category.name}</h5>
                          <div className="store_list">
                            {group.items.map((item) => renderStoreItemButton(item))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="store_card store_editor_card">
              <h3>Editar item seleccionado</h3>

              {!selectedStoreItem ? (
                <p className="text-muted">Selecciona un item para editar sus datos de tienda.</p>
              ) : (
                <form onSubmit={handleSaveStoreItem}>
                  <div className="mb-2">
                    <label className="form-label">Producto maestro</label>
                    <input
                      className="form-control"
                      value={`${selectedStoreItem.product?.name || ''} (${selectedStoreItem.product?.code || ''})`}
                      disabled
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Nombre en la tienda</label>
                    <input
                      className="form-control"
                      value={form.alias}
                      onChange={(e) => setForm((prev) => ({ ...prev, alias: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="store_price_grid mb-2">
                    <div>
                      <label className="form-label">Precio</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.webPrice}
                        onChange={(e) => setForm((prev) => ({ ...prev, webPrice: e.target.value }))}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Precio con descuento</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.compareAtPrice}
                        onChange={(e) => setForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="mb-2 form-check d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    />
                    <label className="form-check-label">Publicado en tienda</label>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Categorias de tienda</label>
                    <select
                      multiple
                      className="form-select"
                      value={form.categoryIds.map((id) => String(id))}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions).map((option) => Number(option.value));
                        setForm((prev) => ({ ...prev, categoryIds: values }));
                      }}
                    >
                      {storeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <small className="store_hint_text">Presiona Ctrl para seleccionar varios.</small>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Descripcion corta</label>
                    <input
                      className="form-control"
                      value={form.shortDescription}
                      onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Descripcion larga</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      value={form.longDescription}
                      onChange={(e) => setForm((prev) => ({ ...prev, longDescription: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Imagenes actuales de la tienda</label>
                    <div className="store_gallery_grid">
                      {form.existingGallery.length === 0 && (
                        <p className="store_gallery_empty">Sin imagenes cargadas.</p>
                      )}

                      {form.existingGallery.map((imagePath, index) => (
                        <div key={`${imagePath}-${index}`} className="store_gallery_item">
                          <ZoomableImage
                            src={getMediaSrc(imagePath)}
                            alt={`Imagen ${index + 1}`}
                            thumbnailWidth={72}
                            thumbnailHeight={72}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveExistingImage(index)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Anexar nuevas imagenes</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleAppendNewImages(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <small className="store_hint_text">
                      Evita imagenes muy rectangulares. Usa proporciones cercanas a 1:1 (aprox. 0.85:1 a 1.15:1).
                    </small>

                    {form.newImages.length > 0 && (
                      <div className="store_gallery_grid store_new_gallery_grid">
                        {newImagePreviews.map((preview, index) => (
                          <div key={preview.id} className="store_gallery_item store_new_gallery_item">
                            <ZoomableImage
                              src={preview.previewUrl}
                              alt={`Nueva imagen ${index + 1}`}
                              thumbnailWidth={72}
                              thumbnailHeight={72}
                            />
                            <span className="store_new_gallery_name">{preview.file.name}</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveNewImage(index)}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingItem}>
                    {savingItem ? 'Guardando...' : 'Guardar item'}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
