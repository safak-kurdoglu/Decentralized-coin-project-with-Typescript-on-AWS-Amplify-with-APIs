import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface nodesState {
  nodes: object[],
  login: boolean
  logout: boolean
}

const initialState: nodesState = {
  nodes: [],
  login: false,
  logout: false
}

export const slice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    assign: (state, action: PayloadAction<object[]>) => {
      state.nodes = action.payload
    },
    login: (state, action: PayloadAction<boolean>) => {
      state.login = action.payload
    },
    logout: (state, action: PayloadAction<boolean>) => {
      state.logout = action.payload
    }
  },
})

export const { assign, login, logout } = slice.actions

export default slice.reducer
