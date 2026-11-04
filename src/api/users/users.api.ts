import client from "../client";
import { USER_ENDPOINTS } from "../endpoints";

export const UserProfileApi = () => client.get(USER_ENDPOINTS.PROFILE)
export const UpdateUserProfileApi = (payload: Record<string, unknown>) => client.post(USER_ENDPOINTS.PROFILE, payload)
// Closes the account: signed out everywhere, restorable by signing in for 30 days (Q46).
export const DeactivateAccountApi = () => client.delete(USER_ENDPOINTS.DEACTIVATE)
