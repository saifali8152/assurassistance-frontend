// src/api/zonesApi.ts
//
// The country → pricing-zone map. See backend/docs/API.md §15.
//
import { apiGet, apiPatch } from "../lib/api";

export type Zone = { zone: string; countryCount: number; activeCount: number };

export type ZoneCountry = {
  country_code: string;
  name_en: string;
  name_fr: string;
  zone: string;
  active: boolean;
};

export const listZonesApi = () => apiGet<{ success: boolean; data: Zone[] }>("/zones");

export const listZoneCountriesApi = (zone?: string) =>
  apiGet<{ success: boolean; data: ZoneCountry[] }>(
    `/zones/countries${zone ? `?zone=${encodeURIComponent(zone)}` : ""}`
  );

export const assignZoneApi = (payload: { country_codes: string[]; zone: string; active?: boolean }) =>
  apiPatch<{
    success: boolean;
    message?: string;
    data: { updated: number; unknown: string[]; zone: string };
  }>("/zones/assign", payload);
