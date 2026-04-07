interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  type: 'in_stock' | 'pre_order'
}

interface OrderNotification {
  orderNumber: string
  customerName: string
  phone: string
  email?: string | null
  items: OrderItem[]
  total: number
  shippingMethod: string
  shippingCost: number
  paymentMethod: string
  isPreOrder: boolean
  advancePayment?: number
}

function formatPrice(price: number): string {
  return `₡${price.toLocaleString('es-CR')}`
}

function getShippingMethodName(key: string): string {
  const methods: Record<string, string> = {
    'pickup': 'Recoger en tienda',
    'gam': 'Dentro del GAM',
    'outside_gam': 'Fuera del GAM'
  }
  return methods[key] || key
}

export async function sendOrderNotification(order: OrderNotification): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured - skipping notification')
    return false
  }

  // Build items list
  const itemsList = order.items
    .map(item => {
      const typeEmoji = item.type === 'pre_order' ? '📦' : '✅'
      return `${typeEmoji} ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    })
    .join('\n')

  // Determine order type
  const hasPreOrderItems = order.items.some(item => item.type === 'pre_order')
  const orderType = hasPreOrderItems ? '📦 PRE-PEDIDO' : '✅ EN STOCK'
  const urgencyEmoji = hasPreOrderItems ? '⚠️' : '🛒'

  const message = `
${urgencyEmoji} *NUEVO PEDIDO* ${orderType}

📝 *Orden:* ${order.orderNumber}

👤 *Cliente:* ${order.customerName}
📱 *Tel:* ${order.phone}
${order.email ? `📧 *Email:* ${order.email}` : ''}

📦 *Productos:*
${itemsList}

🚚 *Envío:* ${getShippingMethodName(order.shippingMethod)} ${order.shippingCost > 0 ? `(${formatPrice(order.shippingCost)})` : '(Gratis)'}

💳 *Pago:* ${order.paymentMethod}

💰 *Total:* ${formatPrice(order.total)}
${hasPreOrderItems && order.advancePayment ? `\n💸 *Adelanto requerido:* ${formatPrice(order.advancePayment)}` : ''}

${hasPreOrderItems ? '⚠️ *Este pedido requiere confirmación de disponibilidad antes de procesar.*' : '✅ *Listo para procesar.*'}
  `.trim()

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Telegram API error:', errorData)
      return false
    }

    console.log('Telegram notification sent successfully for order:', order.orderNumber)
    return true
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return {
      success: false,
      message: 'Telegram credentials not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env'
    }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: '🧪 *Test de conexión*\n\nSi ves este mensaje, la configuración de Telegram es correcta.',
          parse_mode: 'Markdown',
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: `Telegram API error: ${JSON.stringify(errorData)}`
      }
    }

    return {
      success: true,
      message: 'Test message sent successfully!'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to send test message: ${error}`
    }
  }
}