/**
 * API configuration for Travhorse Restaurants app.
 * Base URL for app v1 endpoints.
 */

export const API_BASE_URL = "https://mobiledev.travclicks.com/api/app/v1";

/**
 * Build a full API URL from a path (e.g. "/tickets" or "tickets").
 * Ensures a single slash between base and path.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
