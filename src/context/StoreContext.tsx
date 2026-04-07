'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface StoreSettings {
  preorder_delivery_time: string
}

interface StoreContextType {
  settings: StoreSettings
  isLoading: boolean
}

const defaultSettings: StoreSettings = {
  preorder_delivery_time: '1.5 semanas'
}

const StoreContext = createContext<StoreContextType>({
  settings: defaultSettings,
  isLoading: true
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/store-settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings || defaultSettings)
        }
      } catch (error) {
        console.error('Error fetching store settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <StoreContext.Provider value={{ settings, isLoading }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}