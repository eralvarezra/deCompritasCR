import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'
import { getOrders, createOrder } from '@/lib/demo-store'
import { OrderItem, SHIPPING_METHODS, ShippingMethodKey } from '@/types/database.types'
import { sendOrderNotification } from '@/lib/telegram'

interface OrderRequest {
  customer_name: string
  phone: string
  email?: string | null
  items: OrderItem[]
  total: number
  province?: string | null
  canton?: string | null
  district?: string | null
  exact_address?: string | null
  shipping_method: ShippingMethodKey
  shipping_cost: number
  payment_method?: string | null
  payment_method_name?: string | null
  payment_proof_url?: string | null
  billing_same_as_shipping: boolean
  billing_name?: string | null
  billing_province?: string | null
  billing_canton?: string | null
  billing_district?: string | null
  billing_exact_address?: string | null
}

async function generateOrderNumber(supabase: ReturnType<typeof getSupabase>): Promise<string> {
  if (!supabase) {
    return `ORD${Date.now().toString().slice(-6)}`
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return 'ORD000001'
  }

  const lastNumber = (data as { order_number: string }).order_number
  const numericPart = parseInt(lastNumber.replace('ORD', ''), 10)
  const nextNumber = numericPart + 1

  return `ORD${nextNumber.toString().padStart(6, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search')

    if (!supabase) {
      return NextResponse.json({ orders: getOrders() })
    }

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchTerm) {
      query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    }

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderRequest = await request.json()

    if (!body.customer_name || !body.phone || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cleanPhone = body.phone.replace(/\D/g, '')
    if (cleanPhone.length < 8) {
      return NextResponse.json({ error: 'Invalid phone number - must have at least 8 digits' }, { status: 400 })
    }

    if (body.shipping_method !== 'pickup') {
      if (!body.province || !body.canton || !body.district || !body.exact_address) {
        return NextResponse.json({ error: 'Shipping address is required for delivery' }, { status: 400 })
      }
    }

    if (!body.payment_method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    const processedItems: OrderItem[] = body.items.map(item => ({
      ...item,
      type: item.type || 'in_stock'
    }))

    const supabase = getSupabase()
    const totalWithShipping = body.total + body.shipping_cost
    const hasPreOrderItems = processedItems.some(item => item.type === 'pre_order')

    let advancePayment = 0
    for (const item of processedItems) {
      const itemTotal = item.price * item.quantity
      if (item.type === 'pre_order') {
        advancePayment += itemTotal * 0.5
      } else {
        advancePayment += itemTotal
      }
    }
    advancePayment += body.shipping_cost
    advancePayment = Math.ceil(advancePayment)

    const orderNumber = await generateOrderNumber(supabase)

    if (!supabase) {
      const order = createOrder({
        customer_name: body.customer_name,
        phone: body.phone,
        email: body.email,
        items: processedItems,
        total: totalWithShipping,
        status: 'pending',
        order_number: orderNumber,
        payment_method: body.payment_method,
        payment_proof_url: body.payment_proof_url || null,
        shipping_method: body.shipping_method,
        shipping_cost: body.shipping_cost,
        province: body.province,
        canton: body.canton,
        district: body.district,
        exact_address: body.exact_address,
      })

      // Send Telegram notification for demo mode
      try {
        await sendOrderNotification({
          orderNumber,
          customerName: body.customer_name,
          phone: body.phone,
          email: body.email,
          items: processedItems,
          total: totalWithShipping,
          shippingMethod: body.shipping_method,
          shippingCost: body.shipping_cost,
          paymentMethod: body.payment_method_name || body.payment_method || 'No especificado',
          isPreOrder: hasPreOrderItems,
          advancePayment: hasPreOrderItems ? advancePayment : undefined,
        })
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError)
      }

      return NextResponse.json({ success: true, order, orderNumber, isPreOrder: hasPreOrderItems, advancePayment })
    }

    const weekCycleId = await getOrCreateCurrentWeekCycle(supabase)

    for (const item of processedItems) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()

      if (product) {
        const currentStock = (product as { stock: number }).stock
        if (currentStock === 0) {
          item.type = 'pre_order'
        } else if (currentStock < item.quantity) {
          return NextResponse.json({ error: `No hay suficiente stock de ${item.name}. Disponible: ${currentStock}` }, { status: 400 })
        } else {
          item.type = 'in_stock'
        }
      }
    }

    const orderData = {
      order_number: orderNumber,
      customer_name: body.customer_name,
      phone: body.phone,
      email: body.email,
      items: processedItems,
      total: body.total,
      total_with_shipping: totalWithShipping,
      amount_paid: 0,
      advance_payment: advancePayment,
      status: 'pending',
      week_cycle_id: weekCycleId,
      province: body.shipping_method !== 'pickup' ? body.province : null,
      canton: body.shipping_method !== 'pickup' ? body.canton : null,
      district: body.shipping_method !== 'pickup' ? body.district : null,
      exact_address: body.shipping_method !== 'pickup' ? body.exact_address : null,
      shipping_method: body.shipping_method,
      shipping_cost: body.shipping_cost,
      payment_method: body.payment_method,
      payment_proof_url: body.payment_proof_url || null,
      billing_same_as_shipping: body.billing_same_as_shipping,
      billing_name: body.billing_same_as_shipping ? null : body.billing_name,
      billing_province: body.billing_same_as_shipping ? null : body.billing_province,
      billing_canton: body.billing_same_as_shipping ? null : body.billing_canton,
      billing_district: body.billing_same_as_shipping ? null : body.billing_district,
      billing_exact_address: body.billing_same_as_shipping ? null : body.billing_exact_address,
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData as never)
      .select()
      .single()

    if (orderError) {
      console.error('Order insertion error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    for (const item of processedItems) {
      if (item.type === 'in_stock') {
        const { data: productData } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (productData) {
          const currentStock = (productData as { stock: number }).stock
          const newStock = Math.max(0, currentStock - item.quantity)

          await supabase
            .from('products')
            .update({ stock: newStock } as never)
            .eq('id', item.product_id)
        }
      }
    }

    // Send Telegram notification for new order
    try {
      await sendOrderNotification({
        orderNumber,
        customerName: body.customer_name,
        phone: body.phone,
        email: body.email,
        items: processedItems,
        total: totalWithShipping,
        shippingMethod: body.shipping_method,
        shippingCost: body.shipping_cost,
        paymentMethod: body.payment_method_name || body.payment_method || 'No especificado',
        isPreOrder: hasPreOrderItems,
        advancePayment: hasPreOrderItems ? advancePayment : undefined,
      })
    } catch (telegramError) {
      console.error('Failed to send Telegram notification:', telegramError)
      // Don't fail the order if Telegram notification fails
    }

    return NextResponse.json({
      success: true,
      order,
      orderNumber,
      isPreOrder: hasPreOrderItems,
      advancePayment,
      totalWithShipping
    })
  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getOrCreateCurrentWeekCycle(supabase: NonNullable<ReturnType<typeof getSupabase>>): Promise<string> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysSinceSaturday = (dayOfWeek + 1) % 7

  const startDate = new Date(now)
  startDate.setDate(now.getDate() - daysSinceSaturday)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  const { data: existingCycle } = await supabase
    .from('week_cycles')
    .select('id')
    .eq('status', 'open')
    .lte('start_date', now.toISOString())
    .gte('end_date', now.toISOString())
    .single()

  if (existingCycle) {
    return (existingCycle as { id: string }).id
  }

  const { data: newCycle, error } = await supabase
    .from('week_cycles')
    .insert({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'open',
      report_sent: false,
    } as never)
    .select()
    .single()

  if (error || !newCycle) {
    throw new Error('Failed to create week cycle')
  }

  return (newCycle as { id: string }).id
}