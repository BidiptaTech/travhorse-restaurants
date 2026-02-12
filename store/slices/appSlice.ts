import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "light" | "dark";

export interface AppState {
  theme: ThemeMode;
  lastScannedTicket: string | null;
}

const initialState: AppState = {
  theme: "light",
  lastScannedTicket: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLastScannedTicket: (state, action: PayloadAction<string | null>) => {
      state.lastScannedTicket = action.payload;
    },
  },
});

export const { setTheme, setLastScannedTicket } = appSlice.actions;
export default appSlice.reducer;
