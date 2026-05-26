type ImportedAsset = string | { src: string };

export function assetSrc(asset: ImportedAsset): string {
  return typeof asset === "string" ? asset : asset.src;
}
