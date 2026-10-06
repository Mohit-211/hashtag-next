/**
 * Add to Cart request for MANUAL-supplier products (POST /product/cart).
 *
 * Sent as multipart/form-data:
 *   product_id            "103418"
 *   type                  "MANUAL"
 *   variants              JSON array (string), e.g.
 *     [{
 *       "variant_id": 2683018,
 *       "quantity": 50,
 *       "customization": [
 *         { "customization_option_id": 1, "customization_option_value_id": 6, "image_index": 0 }
 *       ],
 *       "addons": [{ "product_addon_id": 20, "quantity": 50 }]
 *     }]
 *   customization_images  binary File (SVG/AI/…), repeated
 *
 * Files are the original File objects (never base64/JSON). A customization
 * entry with an upload carries `image_index` = its file's position in
 * `customization_images` (counted across all variants); entries without an
 * upload omit it. Several files on one option → one entry per file.
 */

export const MANUAL_CART_TYPE = "MANUAL";

export interface ManualCartLine {
  optionId: number;
  valueId: number;
  /** Upload order = image_index order. */
  images?: File[];
}

export interface ManualCartAddon {
  productAddonId: number;
  quantity: number;
}

/** One variant as selected on the page. */
export interface ManualCartVariantInput {
  variantId: number;
  quantity: number;
  lines: ManualCartLine[];
  addons?: ManualCartAddon[];
}

interface ManualCartCustomizationPayload {
  customization_option_id: number;
  customization_option_value_id: number;
  image_index?: number;
}

interface ManualCartVariantPayload {
  variant_id: number;
  quantity: number;
  customization: ManualCartCustomizationPayload[];
  addons: { product_addon_id: number; quantity: number }[];
}

/** Request body — multipart/form-data with `variants` as JSON and Files appended separately. */
export function buildManualCartRequest({
  productId,
  type = MANUAL_CART_TYPE,
  variants,
}: {
  productId: number;
  type?: string;
  variants: ManualCartVariantInput[];
}): FormData {
  // files[j] is the file for image_index j, across all variants.
  const files: File[] = [];

  const variantsPayload: ManualCartVariantPayload[] = variants.map((v) => ({
    variant_id: v.variantId,
    quantity: v.quantity,
    customization: v.lines.flatMap((line) => {
      const base = { customization_option_id: line.optionId, customization_option_value_id: line.valueId };
      const images = line.images ?? [];
      if (images.length === 0) return [base];
      return images.map((file) => {
        const entry = { ...base, image_index: files.length };
        files.push(file);
        return entry;
      });
    }),
    addons: (v.addons ?? []).map((a) => ({ product_addon_id: a.productAddonId, quantity: a.quantity })),
  }));

  const formData = new FormData();
  formData.append("product_id", String(productId));
  formData.append("type", type);
  formData.append("variants", JSON.stringify(variantsPayload));

  // The original File objects as binary parts — never base64, never in JSON.
  files.forEach((file) => formData.append("customization_images", file, file.name));

  return formData;
}
