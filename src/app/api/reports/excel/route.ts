import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getSupabase } from '@/lib/supabase/api'
import { getOrders } from '@/lib/demo-store'

interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  type: 'in_stock' | 'pre_order'
}

interface Order {
  id: string
  customer_name: string
  phone: string
  items: OrderItem[]
  total: number
  status: string
  week_cycle_id: string | null
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')

    const supabase = getSupabase()

    let orders: Order[] = []

    if (!supabase) {
      orders = getOrders() as Order[]
    } else {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (cycleId) {
        query = query.eq('week_cycle_id', cycleId)
      }

      const { data, error } = await query

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
      }

      orders = (data || []) as Order[]
    }

    const preOrderOrders = orders.filter(order =>
      order.items.some(item => item.type === 'pre_order')
    )

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'DeCompritas'
    workbook.created = new Date()

    // Sheet 1: Pre-order Orders
    const ordersSheet = workbook.addWorksheet('Pedidos Pre-pedido', {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    ordersSheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'ID del Pedido', key: 'id', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Hora', key: 'hora', width: 10 },
    ]

    // Style header
    ordersSheet.getRow(1).font = { bold: true }
    ordersSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    }

    preOrderOrders.forEach((order, index) => {
      ordersSheet.addRow({
        no: index + 1,
        id: order.id.substring(0, 8),
        cliente: order.customer_name,
        telefono: order.phone,
        total: order.total,
        estado: order.status === 'pending' ? 'Pendiente' : order.status === 'confirmed' ? 'Confirmado' : 'Cancelado',
        fecha: new Date(order.created_at).toLocaleDateString('es-CR'),
        hora: new Date(order.created_at).toLocaleTimeString('es-CR'),
      })
    })

    // Sheet 2: Products to buy
    const productCounts: Record<string, { quantity: number; revenue: number }> = {}

    preOrderOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.type === 'pre_order') {
          if (!productCounts[item.name]) {
            productCounts[item.name] = { quantity: 0, revenue: 0 }
          }
          productCounts[item.name].quantity += item.quantity
          productCounts[item.name].revenue += item.price * item.quantity
        }
      })
    })

    const productsSheet = workbook.addWorksheet('Productos a Comprar', {
      views: [{ state: 'frozen', ySplit: 1 }]
    })

    productsSheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Ingresos', key: 'ingresos', width: 15 },
    ]

    productsSheet.getRow(1).font = { bold: true }
    productsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    }

    Object.entries(productCounts)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .forEach(([name, data], index) => {
        productsSheet.addRow({
          no: index + 1,
          producto: name,
          cantidad: data.quantity,
          ingresos: data.revenue,
        })
      })

    // Sheet 3: Summary
    const summarySheet = workbook.addWorksheet('Resumen')

    const totalRevenue = preOrderOrders.reduce((sum, o) => sum + o.total, 0)
    const pendingOrders = preOrderOrders.filter(o => o.status === 'pending').length
    const confirmedOrders = preOrderOrders.filter(o => o.status === 'confirmed').length
    const cancelledOrders = preOrderOrders.filter(o => o.status === 'cancelled').length
    const preOrderItems = preOrderOrders.flatMap(o => o.items).filter(i => i.type === 'pre_order').reduce((sum, i) => sum + i.quantity, 0)

    summarySheet.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
    ]

    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    }

    summarySheet.addRows([
      { metrica: 'Pedidos con Pre-pedido', valor: preOrderOrders.length },
      { metrica: 'Pedidos Pendientes', valor: pendingOrders },
      { metrica: 'Pedidos Confirmados', valor: confirmedOrders },
      { metrica: 'Pedidos Cancelados', valor: cancelledOrders },
      { metrica: 'Total Productos Pre-pedido', valor: preOrderItems },
      { metrica: 'Ingresos Totales', valor: `₡${totalRevenue.toFixed(2)}` },
    ])

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    const date = new Date().toISOString().split('T')[0]
    const filename = `reporte-decompritas-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json({ error: 'Failed to generate Excel' }, { status: 500 })
  }
}