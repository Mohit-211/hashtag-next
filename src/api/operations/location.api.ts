import client from "../client";

// 🏙️ Get States by Country ID
export const GetStatesApi = (countryId: number | string) =>
  client.get(`/country/${countryId}`);

// 🌆 Get Cities by State ID
export const GetCitiesApi = (stateId: number | string) =>
  client.get(`/state/${stateId}`);