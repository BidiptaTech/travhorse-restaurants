import { createAsyncThunk } from "@reduxjs/toolkit";
import { loadAuth } from "../../utils/authStorage";
import { AUTH_LOGOUT_ENDPOINT, signOut } from "./authSlice";

// Async thunk to handle user logout
export const logoutUser = createAsyncThunk(
  "login/logoutUser",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Get token from AsyncStorage instead of Redux state
      const auth = await loadAuth();
      const token = auth?.token ?? null;

      console.log("Logging out user...");

      // If we have a token, make API call to logout on server
      if (token) {
        try {
          const response = await fetch(AUTH_LOGOUT_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.warn(
              `Logout API call failed with status: ${response.status}`,
            );
            // Don't throw error here - we still want to clear local state
          } else {
            const data = await response.json();
            console.log("Server logout successful:", data);
          }
        } catch (error) {
          console.warn("Logout API call failed:", error);
          // Don't throw error here - we still want to clear local state
        }
      }

      // Clear local authentication state
      dispatch(signOut());

      console.log("User logged out successfully");
      return;
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, we should clear the local state
      dispatch(signOut());
      return rejectWithValue(
        error instanceof Error ? error.message : "Logout failed",
      );
    }
  },
);

// Export the auth slice actions for convenience
export { setCredentials, signOut } from "./authSlice";
export type { AuthState, User } from "./authSlice";

