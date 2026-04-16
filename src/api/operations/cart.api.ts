import client from "../client";
import { CART_ENDPOINTS } from "../endpoints";

// ➕ Add to cart
export const AddToCartApi = (payload: any) =>
  client.post(CART_ENDPOINTS.ADD_TO_CART, payload);

// 📦 Get all cart items
export const GetAllCartItemsApi = () =>
  client.get(CART_ENDPOINTS.GET_ALL);

// 🔼 Increment quantity
export const IncrementCartItemApi = (payload: any) =>
  client.put(CART_ENDPOINTS.INCREMENT, payload);

// 🔽 Decrement quantity
export const DecrementCartItemApi = (payload: any) =>
  client.put(CART_ENDPOINTS.DECREMENT, payload);

// 🔄 Update quantity (direct set)
export const UpdateCartQuantityApi = (payload: any) =>
  client.post(CART_ENDPOINTS.UPDATE_QUANTITY, payload);

// ❌ Remove item from cart
export const RemoveFromCartApi = (payload: any) =>
  client.post(CART_ENDPOINTS.REMOVE_FROM_CART, payload);

// ❤️ Move item to wishlist
export const MoveCartToWishlistApi = (payload: any) =>
  client.post(CART_ENDPOINTS.MOVE_TO_WISHLIST, payload);