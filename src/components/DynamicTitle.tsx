'use client'
import { useEffect } from 'react'

export function DynamicTitle() {
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings?.site_title) {
          document.title = `${data.settings.site_title} — Tienda Online`
        }
      })
      .catch(() => { /* Keep default title on error */ })
  }, [])
  return null
}