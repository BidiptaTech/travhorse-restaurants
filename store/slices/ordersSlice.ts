import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiUrl } from "@/constants/api";
import type { RootState } from "@/store";

/** GET restaurant orders (ongoing + upcoming; past ignored). */
export const RESTAURANT_ORDERS_ENDPOINT = apiUrl("restaurant-orders");

/** UI shape for an ongoing order/ticket. */
export interface OngoingOrder {
  id: string;
  ticketId: string;
  event: string;
  holder: string;
  guests: number;
  checkedInGuests: number;
  table: string;
}

/** UI shape for an upcoming order/ticket. */
export interface UpcomingOrder {
  id: string;
  ticketId: string;
  event: string;
  holder: string;
  date: string;
  guests: number;
}

/** Raw item from API (may use snake_case). */
function normalizeOngoing(raw: Record<string, unknown>): OngoingOrder {
  const id = String(raw.id ?? raw.ticket_id ?? "");
  const ticketId = String(raw.ticket_id ?? raw.ticketId ?? id);
  return {
    id: id || ticketId,
    ticketId,
    event: String(raw.event ?? raw.event_name ?? raw.title ?? ""),
    holder: String(raw.holder ?? raw.guest_name ?? raw.customer_name ?? ""),
    guests: Number(raw.guests ?? raw.guest_count ?? 0),
    checkedInGuests: Number(raw.checked_in_guests ?? raw.checkedInGuests ?? 0),
    table: String(raw.table ?? raw.table_number ?? ""),
  };
}

function normalizeUpcoming(raw: Record<string, unknown>): UpcomingOrder {
  const id = String(raw.id ?? raw.ticket_id ?? "");
  const ticketId = String(raw.ticket_id ?? raw.ticketId ?? id);
  return {
    id: id || ticketId,
    ticketId,
    event: String(raw.event ?? raw.event_name ?? raw.title ?? ""),
    holder: String(raw.holder ?? raw.guest_name ?? raw.customer_name ?? ""),
    date: String(raw.date ?? raw.event_date ?? raw.scheduled_at ?? ""),
    guests: Number(raw.guests ?? raw.guest_count ?? 0),
  };
}

export const fetchRestaurantOrders = createAsyncThunk<
  { ongoing: OngoingOrder[]; upcoming: UpcomingOrder[] },
  void,
  { state: RootState }
>("orders/fetchRestaurantOrders", async (_, { getState, rejectWithValue }) => {
  const token = getState().auth.token;
  if (!token) {
    return rejectWithValue("Not authenticated");
  }

  const res = await fetch(RESTAURANT_ORDERS_ENDPOINT, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return rejectWithValue(
      json?.message ?? json?.error ?? `Request failed (${res.status})`
    );
  }

  const data = json?.data ?? json;
  const rawOngoing = Array.isArray(data?.ongoing) ? data.ongoing : [];
  const rawUpcoming = Array.isArray(data?.upcoming) ? data.upcoming : [];

  const ongoing = rawOngoing.map((o: Record<string, unknown>) => normalizeOngoing(o));
  const upcoming = rawUpcoming.map((o: Record<string, unknown>) => normalizeUpcoming(o));

  console.log("[orders] ongoing:", ongoing);
  console.log("[orders] upcoming:", upcoming);

  return { ongoing, upcoming };
});

export interface OrdersState {
  ongoing: OngoingOrder[];
  upcoming: UpcomingOrder[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  ongoing: [],
  upcoming: [],
  loading: false,
  error: null,
};

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
        state.ongoing = action.payload.ongoing;
        state.upcoming = action.payload.upcoming;
      })
      .addCase(fetchRestaurantOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string | undefined) ?? "Failed to load orders";
      });
  },
});

export const { clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
