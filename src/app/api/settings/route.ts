import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'

// Default settings
const DEFAULT_SETTINGS = {
  site_title: 'DeCompritas',
  site_description: '',
  preorder_delivery_time: '1.5 semanas'
}

export async function GET() {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    const { data: settings, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['site_title', 'site_description', 'preorder_delivery_time'])

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
    settings?.forEach((setting: { key: string; value: string }) => {
      settingsMap[setting.key] = setting.value
    })

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}