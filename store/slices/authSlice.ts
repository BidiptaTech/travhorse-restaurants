import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiUrl } from "@/constants/api";

/** Login API endpoint (POST). */
export const AUTH_LOGIN_ENDPOINT = apiUrl("restaurant-login");

/** Logout API endpoint (POST). */
export const AUTH_LOGOUT_ENDPOINT = apiUrl("restaurant-logout");

export interface DmcUser {
  id: string;
  email: string;
  name: string;
  dmc: string ;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  guest_name?: string;
  guest_id?: string;
  image?: string;
  token?: string;
  dmcUsers?: DmcUser[]; // ✅ add this
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      console.log("[authSlice] login data stored:", {
        user: state.user,
        token: state.token ? `${state.token.slice(0, 20)}...` : null,
        isAuthenticated: state.isAuthenticated,
      });
      console.log("[authSlice] login data stored:", action.payload);
    },
    signOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setCredentials, signOut, updateUser } = authSlice.actions;
export default authSlice.reducer;
