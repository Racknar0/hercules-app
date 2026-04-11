export function getAssetSrc(asset) {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'object' && typeof asset.src === 'string') {
    return asset.src;
  }
  return String(asset);
}
