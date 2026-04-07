import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getSupabase } from '@/lib/supabase/api'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAuth(request: NextRequest): boolean {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return false

  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ shippingMethods: [] })
    }

    const { data: shippingMethods, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching shipping methods:', error)
      return NextResponse.json({ shippingMethods: [] })
    }

    return NextResponse.json({ shippingMethods })
  } catch (error) {
    console.error('Shipping methods fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, shippingMethod } = body

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ success: true })
    }

    if (action === 'create') {
      const { data, error } = await supabase
        .from('shipping_methods')
        .insert({
          key: shippingMethod.key,
          name: shippingMethod.name,
          description: shippingMethod.description || null,
          price: shippingMethod.price ?? 0,
          is_active: shippingMethod.is_active ?? true,
          sort_order: shippingMethod.sort_order || 0,
        } as never)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to create shipping method' }, { status: 500 })
      }

      return NextResponse.json({ success: true, shippingMethod: data })
    }

    if (action === 'update') {
      const { data, error } = await supabase
        .from('shipping_methods')
        .update({
          key: shippingMethod.key,
          name: shippingMethod.name,
          description: shippingMethod.description || null,
          price: shippingMethod.price,
          is_active: shippingMethod.is_active,
          sort_order: shippingMethod.sort_order,
        } as never)
        .eq('id', shippingMethod.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update shipping method' }, { status: 500 })
      }

      return NextResponse.json({ success: true, shippingMethod: data })
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', shippingMethod.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete shipping method' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Shipping methods update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}