import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface UserStorage {
  id: string | number
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'user'
  providers: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UserStore {
  user: UserStorage | null
  setUser: (user: UserStorage) => void
  clearUser: () => void
}

export const useUserStore = create(
  devtools(
    persist<UserStore>(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
        clearUser: () => set({ user: null }),
      }),
      {
        name: 'user_storage',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  ),
)
