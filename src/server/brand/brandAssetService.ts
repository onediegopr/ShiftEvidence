import fs from "node:fs";
import path from "node:path";
import { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK } from "../../lib/brandAssets";

export { BRAND_PUBLIC_ASSETS, BRAND_WORDMARK };
export const PRIMARY_BRAND_LOGO_PUBLIC_PATH = BRAND_PUBLIC_ASSETS.primaryLogo;

export function resolveBrandAssetAbsolutePath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

export function readBrandAssetBuffer(publicPath: string) {
  const absolutePath = resolveBrandAssetAbsolutePath(publicPath);

  try {
    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath);
    }
  } catch {
    return null;
  }

  return null;
}

export function readPrimaryBrandLogoBuffer() {
  return readBrandAssetBuffer(PRIMARY_BRAND_LOGO_PUBLIC_PATH);
}
