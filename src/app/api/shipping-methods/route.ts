import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'

// Default fallback shipping methods
const DEFAULT_SHIPPING_METHODS = [
  { id: 'default-pickup', key: 'pickup', name: 'Recoger en tienda', description: 'Recoge tu pedido sin costo adicional', price: 0, is_active: true, sort_order: 1 },
  { id: 'default-gam', key: 'gam', name: 'Correos de Costa Rica - Dentro del GAM', description: 'Entrega en 2-3 días hábiles dentro del Gran Área Metropolitana', price: 2500, is_active: true, sort_order: 2 },
  { id: 'default-outside_gam', key: 'outside_gam', name: 'Correos de Costa Rica - Fuera del GAM', description: 'Entrega en 3-5 días hábiles fuera del Gran Área Metropolitana', price: 3500, is_active: true, sort_order: 3 }
]

export async function GET() {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ shippingMethods: DEFAULT_SHIPPING_METHODS })
    }

    const { data: shippingMethods, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching shipping methods:', error)
      return NextResponse.json({ shippingMethods: DEFAULT_SHIPPING_METHODS })
    }

    return NextResponse.json({ shippingMethods })
  } catch (error) {
    console.error('Shipping methods fetch error:', error)
    return NextResponse.json({ shippingMethods: DEFAULT_SHIPPING_METHODS })
  }
}