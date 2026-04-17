import client from "../client";
import { WISHLIST_ENDPOINTS } from "../endpoints";

// ➕ Add to Wishlist
export const AddToWishlistApi = (payload: {
  product_id: string | number;
  variant_id: string | number;
}) => {
  return client.post(WISHLIST_ENDPOINTS.ADD, payload);
};

// 📥 Get Wishlist
export const GetWishlistApi = () => {
  return client.get(WISHLIST_ENDPOINTS.GET);
};

// ❌ Remove from Wishlist
export const RemoveFromWishlistApi = (id: string | number) => {
  return client.delete(WISHLIST_ENDPOINTS.REMOVE(id));
};

// 🔄 Move Wishlist → Cart
export const MoveWishlistToCartApi = (payload: {
  wishlist_id: string | number;
}) => {
  return client.post(WISHLIST_ENDPOINTS.MOVE_TO_CART, payload);
};