import { apiUrl } from "@/constants/api";
import type { RootState } from "@/store";
import { signOut } from "@/store/slices/authSlice";
import { clearAuth, loadAuth } from "@/utils/authStorage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/** GET restaurant orders (ongoing + upcoming; past ignored). */
export const RESTAURANT_ORDERS_ENDPOINT = apiUrl("restaurant-orders");

export type OrdersErrorKind = "session" | "server" | "not_found" | "generic";

export interface OrdersFetchError {
  title: string;
  message: string;
  kind: OrdersErrorKind;
}

const AUTH_SIGN_OUT = new Set([401, 403]);
const SERVER_SIGN_OUT = new Set([500, 502, 503, 504]);

function sessionExpiredError(): OrdersFetchError {
  return {
    title: "Session expired",
    message: "Your session is no longer valid. Please sign in again to continue.",
    kind: "session",
  };
}

function serverErrorForStatus(status: number): OrdersFetchError {
  switch (status) {
    case 502:
      return {
        title: "Bad gateway",
        message:
          "We could not reach the service (502). Please try again in a moment, then sign in if the problem continues.",
        kind: "server",
      };
    case 503:
      return {
        title: "Service unavailable",
        message:
          "Orders are temporarily unavailable (503). Please wait a short time and try again.",
        kind: "server",
      };
    case 504:
      return {
        title: "Request timed out",
        message:
          "The server took too long to respond (504). Check your connection and try again.",
        kind: "server",
      };
    default:
      return {
        title: "Server error",
        message:
          "Something went wrong on our end. Please sign in again or try later.",
        kind: "server",
      };
  }
}

function notFoundError(): OrdersFetchError {
  return {
    title: "Not found",
    message:
      "This orders endpoint or resource was not found (404). It may have moved or your account may not have access.",
    kind: "not_found",
  };
}

function wrapStringError(message: string): OrdersFetchError {
  return {
    title: "Unable to load orders",
    message,
    kind: "generic",
  };
}

/** First element of order.data from API (booking details). */
export interface OrderDataItem {
  bookingDate?: string;
  visitTime?: string;
  adultCount?: number;
  childCount?: number;
  mealType?: string;
  mealSpecificType?: string;
  fullName?: string;
  totalPrice?: number;
  restaurantName?: string;
  address1?: string;
  address2?: string;
  email?: string;
  phone?: string;
  specialRequests?: string;
  countryCode?: string;
  state?: string;
  zip?: string;
  [key: string]: unknown;
}

/** Raw order item from API (data.data[]). */
export interface RawRestaurantOrder {
  id: number;
  booking_id: number;
  tour_id?: string;
  data?: OrderDataItem[];
  type?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  is_redeemed?: number;
  tour?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Normalized order for list + full raw for detail modal. */
export interface RestaurantOrder {
  id: string;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  guests: number;
  mealType: string;
  mealSpecificType: string;
  holder: string;
  totalPrice: number;
  /** Full API order for detail modal */
  raw: RawRestaurantOrder;
}

function getFirstData(raw: RawRestaurantOrder): OrderDataItem | null {
  const arr = raw?.data;
  if (Array.isArray(arr) && arr.length > 0) return arr[0] as OrderDataItem;
  return null;
}

function normalizeOrder(raw: RawRestaurantOrder): RestaurantOrder {
  const first = getFirstData(raw);
  const adults = Number(first?.adultCount ?? 0);
  const children = Number(first?.childCount ?? 0);
  return {
    id: String(raw.id ?? raw.booking_id ?? ""),
    bookingId: String(raw.tour_id ?? raw.booking_id ?? raw.id ?? ""),
    bookingDate: String(first?.bookingDate ?? ""),
    bookingTime: String(first?.visitTime ?? ""),
    guests: adults + children,
    mealType: String(first?.mealType ?? ""),
    mealSpecificType: String(first?.mealSpecificType ?? ""),
    holder: String(first?.fullName ?? ""),
    totalPrice: Number(first?.totalPrice ?? 0),
    raw,
  };
}

export type OrdersType = "ongoing" | "upcoming";

export const fetchRestaurantOrders = createAsyncThunk<
  { type: OrdersType; orders: RestaurantOrder[] },
  OrdersType,
  { state: RootState }
>(
  "orders/fetchRestaurantOrders",
  async (type, { dispatch, rejectWithValue }) => {
    const auth = await loadAuth();
    const token = auth?.token ?? null;
    if (!token) {
      return rejectWithValue(wrapStringError("Not authenticated"));
    }

    const res = await fetch(RESTAURANT_ORDERS_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Type: type,
      },
    });

    const json = await res.json().catch(() => ({}));
    console.log("[orders] API response", {
      type,
      status: res.status,
      data: json,
    });

    if (AUTH_SIGN_OUT.has(res.status)) {
      dispatch(signOut());
      await clearAuth(auth?.user?.id).catch(() => {});
      return rejectWithValue(sessionExpiredError());
    }

    if (SERVER_SIGN_OUT.has(res.status)) {
      dispatch(signOut());
      await clearAuth(auth?.user?.id).catch(() => {});
      return rejectWithValue(serverErrorForStatus(res.status));
    }

    if (res.status === 404) {
      return rejectWithValue(notFoundError());
    }

    if (!res.ok) {
      const detail =
        json?.message ?? json?.error ?? `Request failed (${res.status})`;
      return rejectWithValue(wrapStringError(String(detail)));
    }

    // API can return { data: { data: [...] } } or { data: [...] } or { data: { data: [...], message, success } }
    const wrapper = json?.data ?? json;
    const dataArray = Array.isArray(wrapper?.data)
      ? wrapper.data
      : Array.isArray(wrapper)
        ? wrapper
        : [];
    const orders = (dataArray as RawRestaurantOrder[]).map((o) =>
      normalizeOrder(o),
    );
    console.log("[orders] parsed", {
      type,
      count: orders.length,
      firstId: orders[0]?.bookingId,
    });

    return { type, orders };
  },
);

export interface OrdersState {
  ongoing: RestaurantOrder[];
  upcoming: RestaurantOrder[];
  loading: boolean;
  error: OrdersFetchError | null;
}

const initialState: OrdersState = {
  ongoing: [],
  upcoming: [],
  loading: false,
  error: null,
};

function rejectedPayloadToError(
  payload: unknown,
  fallbackMessage: string,
): OrdersFetchError {
  if (
    payload &&
    typeof payload === "object" &&
    "title" in payload &&
    "message" in payload &&
    "kind" in payload
  ) {
    return payload as OrdersFetchError;
  }
  if (typeof payload === "string") {
    return wrapStringError(payload);
  }
  return wrapStringError(fallbackMessage);
}

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrdersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurantOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.type === "ongoing") {
          state.ongoing = action.payload.orders;
        }
        if (action.payload.type === "upcoming") {
          state.upcoming = action.payload.orders;
        }
      })
      .addCase(fetchRestaurantOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = rejectedPayloadToError(
          action.payload,
          action.error?.message ?? "Failed to load orders",
        );
      });
  },
});

export const { clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
