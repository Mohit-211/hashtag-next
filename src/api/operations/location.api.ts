import client from "../client";

// 🌍 Get Countries
export const GetCountriesApi = () =>
  client.get("/country?limit=300&page=1&sortBy=desc");

// 🏙️ Get States by Country ID
export const GetStatesApi = (countryId: number | string) =>
  client.get(`/country/${countryId}`);

// 🌆 Get Cities by State ID
export const GetCitiesApi = (stateId: number | string) =>
  client.get(`/state/${stateId}`);