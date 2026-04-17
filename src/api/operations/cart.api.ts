import client from "../client";
import { CART_ENDPOINTS } from "../endpoints";

// ➕ Add to cart
export const AddToCartApi = (payload: {
  product_id: number;
  variant_id: number;
  quantity: number;
}) => client.post(CART_ENDPOINTS.ADD_TO_CART, payload);

// 📦 Get all cart items
export const GetAllCartItemsApi = () =>
  client.get(CART_ENDPOINTS.GET_ALL);

// 🔼 Increment quantity
export const IncrementCartItemApi = (payload: { cart_id: string }) =>
  client.put(CART_ENDPOINTS.INCREMENT, payload);

// 🔽 Decrement quantity
export const DecrementCartItemApi = (payload: { cart_id: string }) =>
  client.put(CART_ENDPOINTS.DECREMENT, payload);

// 🔄 Update quantity (optional full control)
export const UpdateCartQuantityApi = (payload: {
  cart_id: string;
  quantity: number;
}) => client.put(CART_ENDPOINTS.UPDATE_QUANTITY, payload);

// ❌ Remove item from cart (FIXED)
export const RemoveFromCartApi = (cart_id: string) =>
  client.delete(CART_ENDPOINTS.REMOVE_FROM_CART(cart_id));

// ❤️ Move item to wishlist
export const MoveCartToWishlistApi = (payload: { cart_id: string }) =>
  client.post(CART_ENDPOINTS.MOVE_TO_WISHLIST, payload);
