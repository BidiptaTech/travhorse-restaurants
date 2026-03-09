import { apiUrl } from "@/constants/api";
import { loadAuth } from "@/utils/authStorage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Account API endpoints
export const ACCOUNT_UPDATE_SHARE_CONTACT_ENDPOINT = apiUrl(
  "update-share-contact",
);
export const ACCOUNT_DELETE_ENDPOINT = apiUrl("delete-account");

export interface AccountState {
  shareContactNumber: boolean;
  isUpdatingShareContact: boolean;
  error: string | null;
}

const initialState: AccountState = {
  shareContactNumber: false,
  isUpdatingShareContact: false,
  error: null,
};

// Async thunk to update share contact status
export const updateShareContactStatus = createAsyncThunk(
  "account/updateShareContactStatus",
  async (
    payload: {
      email: string;
      guest_id: string;
      share_status: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Updating share contact status:", payload);

      // Get token from AsyncStorage
      const auth = await loadAuth();
      const token = auth?.token ?? null;

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(ACCOUNT_UPDATE_SHARE_CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: payload.email,
          guest_id: payload.guest_id,
          share_status: payload.share_status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      console.log("Share contact status updated successfully:", data);
      return { share_status: payload.share_status };
    } catch (error) {
      console.error("Failed to update share contact status:", error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to update share contact status",
      );
    }
  },
);

// Async thunk to delete account
export const deleteAccount = createAsyncThunk(
  "account/deleteAccount",
  async (
    payload: {
      password: string;
      email: string;
      guest_id: string;
    },
    { rejectWithValue },
  ) => {
    try {
      console.log("Deleting account for:", payload.email);

      // Get token from AsyncStorage
      const auth = await loadAuth();
      const token = auth?.token ?? null;

      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(ACCOUNT_DELETE_ENDPOINT, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: payload.password,
          email: payload.email,
          guest_id: payload.guest_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      console.log("Account deleted successfully:", data);
      return data;
    } catch (error) {
      console.error("Failed to delete account:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    }
  },
);

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    clearAccountError: (state) => {
      state.error = null;
    },
    setShareContactNumber: (state, action: PayloadAction<boolean>) => {
      state.shareContactNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update share contact status
      .addCase(updateShareContactStatus.pending, (state) => {
        state.isUpdatingShareContact = true;
        state.error = null;
      })
      .addCase(updateShareContactStatus.fulfilled, (state, action) => {
        state.isUpdatingShareContact = false;
        state.shareContactNumber = action.payload.share_status;
        state.error = null;
      })
      .addCase(updateShareContactStatus.rejected, (state, action) => {
        state.isUpdatingShareContact = false;
        state.error = action.payload as string;
      })
      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        // Account deleted successfully - reset state
        state.shareContactNumber = false;
        state.isUpdatingShareContact = false;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAccountError, setShareContactNumber } =
  accountSlice.actions;
export default accountSlice.reducer;
