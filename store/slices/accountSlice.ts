import { apiUrl } from "@/constants/api";
import { loadAuth } from "@/utils/authStorage";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Account API endpoints
export const ACCOUNT_UPDATE_SHARE_CONTACT_ENDPOINT = apiUrl(
  "update-share-contact",
);
export const ACCOUNT_DELETE_ENDPOINT = apiUrl("delete-account");
export const UPDATE_RESTAURANT_ENDPOINT = apiUrl("update-restaurant");

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

// Async thunk to update restaurant profile (password + image)
export const updateRestaurant = createAsyncThunk(
  "account/updateRestaurant",
  async (
    payload: {
      restaurant_id: string;
      profile_image?: { uri: string; name?: string; type?: string };
      current_password?: string;
      new_password?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const auth = await loadAuth();
      const token = auth?.token ?? null;

      if (!token) {
        throw new Error("No authentication token available");
      }

      if (!payload.restaurant_id) {
        throw new Error("Restaurant ID is required");
      }

      const formData = new FormData();
      formData.append("restaurant_id", payload.restaurant_id);

      if (payload.current_password) {
        formData.append("current_password", payload.current_password);
      }
      if (payload.new_password) {
        formData.append("new_password", payload.new_password);
      }

      if (payload.profile_image?.uri) {
        const uri = payload.profile_image.uri;
        const name = payload.profile_image.name ?? "profile.jpg";
        const type =
          payload.profile_image.type ?? "image/jpeg";
        formData.append("profile_image", { uri, name, type } as any);
      }

      if (__DEV__) {
        console.log("[updateRestaurant] Sending request", {
          restaurant_id: payload.restaurant_id,
          has_profile_image: !!payload.profile_image?.uri,
          endpoint: UPDATE_RESTAURANT_ENDPOINT,
        });
      }

      const response = await fetch(UPDATE_RESTAURANT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do not set Content-Type; let the runtime set multipart boundary
        },
        body: formData,
      });

      if (__DEV__) {
        console.log("[updateRestaurant] Response status", response.status);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const serverMessage =
          errorData?.message ?? errorData?.error ?? `HTTP ${response.status}`;
        if (response.status === 413) {
          throw new Error(
            serverMessage ||
              "The photo is too large. Please choose a smaller image (under 2 MB).",
          );
        }
        throw new Error(serverMessage);
      }

      let data: Record<string, unknown> = {};
      try {
        const text = await response.text();
        if (text?.trim()) {
          data = JSON.parse(text) as Record<string, unknown>;
        }
      } catch (_) {
        // 200 with empty or non-JSON body – still success
      }

      const imageUrl =
        (data?.image_url as string) ??
        (data?.profile_image as string) ??
        (data?.image as string) ??
        (data?.data as Record<string, unknown>)?.image_url ??
        (data?.data as Record<string, unknown>)?.profile_image ??
        (data?.user as Record<string, unknown>)?.image;
      return { ...data, image_url: imageUrl, profile_image: imageUrl };
    } catch (error) {
      console.error("Failed to update restaurant:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update restaurant",
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
      .addCase(deleteAccount.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.shareContactNumber = false;
        state.isUpdatingShareContact = false;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateRestaurant.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAccountError, setShareContactNumber } =
  accountSlice.actions;
export default accountSlice.reducer;
