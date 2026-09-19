import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type State = {
  theme: 'light' | 'dark'
}

type Actions = {
  clearData: () => void
  updateTheme: (theme: 'light' | 'dark') => void
}

const useThemeStore = create(
  devtools(
    persist<State & Actions>(
      (set) => ({
        clearData: () => {
          set({
            theme: 'dark',
          })
        },
        theme: 'dark',
        updateTheme: (theme) => {
          set((state) => ({
            ...state,
            theme,
          }))
        },
      }),
      {
        name: 'theme_storage',
        storage: createJSONStorage(() => AsyncStorage),
      },
    ),
  ),
)

export { useThemeStore }
