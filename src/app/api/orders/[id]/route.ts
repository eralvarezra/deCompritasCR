import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'
import { getOrders, updateOrder, updateProductStock, getProduct, deleteOrder } from '@/lib/demo-store'

interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
}

interface OrderData {
  id: string
  items: OrderItem[]
  status: string
  customer_name: string
  phone: string
  total: number
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    if (!supabase) {
      const orders = getOrders()
      const order = orders.find(o => o.id === id)
      if (order) {
        return NextResponse.json({ order })
      }
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, amount_paid } = body

    if (status === undefined && amount_paid === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (status !== undefined && !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (!supabase) {
      const orders = getOrders()
      const existingOrder = orders.find(o => o.id === id)
      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (amount_paid !== undefined) updateData.amount_paid = amount_paid

      const order = updateOrder(id, updateData)

      return NextResponse.json({ success: true, order })
    }

    const { data: currentOrderData, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (amount_paid !== undefined) updateData.amount_paid = amount_paid

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customer_name, phone, items, total } = body

    if (!customer_name || !phone || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (!supabase) {
      const order = updateOrder(id, { customer_name, phone, items, total })
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, order })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ customer_name, phone, items, total } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Order edit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    if (!supabase) {
      const deleted = deleteOrder(id)
      if (!deleted) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}