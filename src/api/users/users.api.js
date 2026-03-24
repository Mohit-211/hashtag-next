import client from "../client";
import { USER_ENDPOINTS } from "../endpoints";

export const UserProfileApi = () => client.get(USER_ENDPOINTS.PROFILE)
export const UpdateUserProfileApi = (payload) => client.post(USER_ENDPOINTS.PROFILE, payload)
