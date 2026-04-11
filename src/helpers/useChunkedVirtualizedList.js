import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_ROOT_MARGIN = '320px 0px';

const useChunkedVirtualizedList = (
  items,
  {
    batchSize = DEFAULT_BATCH_SIZE,
    root = null,
    rootMargin = DEFAULT_ROOT_MARGIN,
    resetKey,
  } = {}
) => {
  const safeItems = Array.isArray(items) ? items : [];
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const loaderRef = useRef(null);

  const loadMore = useCallback(() => {
    setVisibleCount((currentCount) =>
      Math.min(currentCount + batchSize, safeItems.length)
    );
  }, [batchSize, safeItems.length]);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, resetKey]);

  useEffect(() => {
    const loaderNode = loaderRef.current;
    if (!loaderNode || visibleCount >= safeItems.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        root,
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(loaderNode);

    return () => {
      observer.disconnect();
    };
  }, [batchSize, loadMore, root, rootMargin, safeItems.length, visibleCount]);

  useEffect(() => {
    const loaderNode = loaderRef.current;
    if (!loaderNode || visibleCount >= safeItems.length) {
      return undefined;
    }

    const checkIfNeedsMore = () => {
      const rect = loaderNode.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top <= viewportHeight + 120) {
        loadMore();
      }
    };

    const frameId = window.requestAnimationFrame(checkIfNeedsMore);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadMore, safeItems.length, visibleCount]);

  const visibleItems = useMemo(
    () => safeItems.slice(0, visibleCount),
    [safeItems, visibleCount]
  );

  return {
    visibleItems,
    visibleCount,
    totalCount: safeItems.length,
    hasMore: visibleCount < safeItems.length,
    loaderRef,
    loadMore,
  };
};

export default useChunkedVirtualizedList;