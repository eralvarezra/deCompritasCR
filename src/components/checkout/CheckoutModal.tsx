'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { X, Loader2, CheckCircle, ShoppingBag, ChevronDown, Package, Clock, MapPin, CreditCard, Truck, Mail, User, Phone, Building, Home, Copy, Check, AlertTriangle, Upload, Image as ImageIcon, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { OrderItem, getDiscountedPrice, getEffectivePrice, getEffectiveStock, COSTA_RICA_PROVINCES, SHIPPING_METHODS, ShippingMethodKey, ShippingMethod, PaymentMethod, CheckoutFormData } from '@/types/database.types'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormErrors {
  customer_name?: string
  phone?: string
  email?: string
  province?: string
  canton?: string
  district?: string
  exact_address?: string
  payment_method?: string
  payment_proof?: string
  billing_name?: string
  billing_province?: string
  billing_canton?: string
  billing_district?: string
  billing_exact_address?: string
}

interface OrderConfirmation {
  orderNumber: string
  isPreOrder: boolean
  advancePayment: number
  totalWithShipping: number
}

const countries = [
  { code: 'CR', name: 'Costa Rica', digits: 8, prefix: '+506', placeholder: '8888 8888' },
  { code: 'MX', name: 'México', digits: 10, prefix: '+52', placeholder: '55 1234 5678' },
  { code: 'US', name: 'Estados Unidos', digits: 10, prefix: '+1', placeholder: '(555) 123-4567' },
  { code: 'OTHER', name: 'Otro país', digits: 0, prefix: '', placeholder: 'Número completo' },
]

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { state, clearCart, totalPrice, totalItems } = useCart()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)
  const [isLoadingShippingMethods, setIsLoadingShippingMethods] = useState(true)
  const [shippingInstructions, setShippingInstructions] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<CheckoutFormData>({
    customer_name: '',
    phone: '',
    country_code: 'CR',
    email: '',
    province: '',
    canton: '',
    district: '',
    exact_address: '',
    shipping_method: 'pickup',
    payment_method: '',
    billing_same_as_shipping: true,
    billing_name: '',
    billing_province: '',
    billing_canton: '',
    billing_district: '',
    billing_exact_address: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null)
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)

  const selectedCountry = countries.find(c => c.code === formData.country_code) || countries[0]
  const selectedShippingMethod = shippingMethods.find(m => m.key === formData.shipping_method)
    || { key: formData.shipping_method, name: SHIPPING_METHODS[formData.shipping_method as keyof typeof SHIPPING_METHODS]?.name || 'Envío', price: SHIPPING_METHODS[formData.shipping_method as keyof typeof SHIPPING_METHODS]?.price || 0 }
  const shippingCost = selectedShippingMethod.price
  const totalWithShipping = totalPrice + shippingCost

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-methods')
        if (response.ok) {
          const data = await response.json()
          setPaymentMethods(data.paymentMethods || [])
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error)
      } finally {
        setIsLoadingPaymentMethods(false)
      }
    }

    const fetchShippingMethods = async () => {
      try {
        const response = await fetch('/api/shipping-methods')
        if (response.ok) {
          const data = await response.json()
          setShippingMethods(data.shippingMethods || [])
        }
      } catch (error) {
        console.error('Error fetching shipping methods:', error)
      } finally {
        setIsLoadingShippingMethods(false)
      }
    }

    const fetchShippingInstructions = async () => {
      try {
        const response = await fetch('/api/shipping-instructions')
        if (response.ok) {
          const data = await response.json()
          setShippingInstructions(data.instructions || {})
        }
      } catch (error) {
        console.error('Error fetching shipping instructions:', error)
      }
    }

    if (isOpen) {
      fetchPaymentMethods()
      fetchShippingMethods()
      fetchShippingInstructions()
    }
  }, [isOpen])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(price)
  }

  const inStockItems = state.items.filter(item => {
    const stock = getEffectiveStock(item.product, item.variant)
    return stock > 0
  })
  const preOrderItems = state.items.filter(item => {
    const stock = getEffectiveStock(item.product, item.variant)
    return stock <= 0
  })

  const hasPreOrderItems = preOrderItems.length > 0

  const inStockTotal = inStockItems.reduce((sum, item) => {
    const price = getEffectivePrice(item.product, item.variant)
    const discountedPrice = getDiscountedPrice(price, item.product.discount_percentage || 0)
    return sum + discountedPrice * item.quantity
  }, 0)

  const preOrderTotal = preOrderItems.reduce((sum, item) => {
    const price = getEffectivePrice(item.product, item.variant)
    const discountedPrice = getDiscountedPrice(price, item.product.discount_percentage || 0)
    return sum + discountedPrice * item.quantity
  }, 0)

  const advancePaymentAmount = Math.ceil(inStockTotal + preOrderTotal * 0.5 + shippingCost)
  const remainingPaymentAmount = Math.ceil(preOrderTotal * 0.5)

  const validatePhone = (phone: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (!country) return phone.length >= 8
    if (country.digits === 0) return phone.replace(/\D/g, '').length >= 8
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length === country.digits
  }

  const validateEmail = (email: string) => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'El nombre es requerido'
    } else if (formData.customer_name.trim().length < 2) {
      newErrors.customer_name = 'El nombre debe tener al menos 2 caracteres'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!validatePhone(formData.phone, formData.country_code)) {
      const country = countries.find(c => c.code === formData.country_code)
      if (country && country.digits > 0) {
        newErrors.phone = `Ingresa ${country.digits} dígitos para ${country.name}`
      } else {
        newErrors.phone = 'Ingresa un número de teléfono válido'
      }
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido'
    }

    if (formData.shipping_method !== 'pickup') {
      if (!formData.province) newErrors.province = 'Selecciona una provincia'
      if (!formData.canton.trim()) newErrors.canton = 'El cantón es requerido'
      if (!formData.district.trim()) newErrors.district = 'El distrito es requerido'
      if (!formData.exact_address.trim()) newErrors.exact_address = 'La dirección exacta es requerida'
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Selecciona un método de pago'
    }

    if (!paymentProof) {
      newErrors.payment_proof = 'Sube el comprobante de pago para continuar'
    }

    if (!formData.billing_same_as_shipping) {
      if (!formData.billing_name.trim()) newErrors.billing_name = 'El nombre de facturación es requerido'
      if (!formData.billing_province) newErrors.billing_province = 'Selecciona una provincia'
      if (!formData.billing_canton.trim()) newErrors.billing_canton = 'El cantón es requerido'
      if (!formData.billing_district.trim()) newErrors.billing_district = 'El distrito es requerido'
      if (!formData.billing_exact_address.trim()) newErrors.billing_exact_address = 'La dirección es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    if (state.items.length === 0) {
      setErrors({ phone: 'El carrito está vacío' })
      return
    }

    setIsSubmitting(true)

    try {
      let paymentProofUrl: string | null = null
      if (paymentProof) {
        setIsLoadingPaymentMethods(true)
        const formDataUpload = new FormData()
        formDataUpload.append('file', paymentProof)

        try {
          const uploadResponse = await fetch('/api/upload/payment-proof', {
            method: 'POST',
            body: formDataUpload,
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            paymentProofUrl = uploadData.url
          }
        } catch (uploadError) {
          console.error('Payment proof upload error:', uploadError)
        }
        setIsLoadingPaymentMethods(false)
      }

      const cleanPhone = formData.phone.replace(/\D/g, '')
      const fullPhone = selectedCountry.prefix ? `${selectedCountry.prefix} ${cleanPhone}` : cleanPhone

      const orderItems: OrderItem[] = state.items.map((item) => {
        const effectivePrice = getEffectivePrice(item.product, item.variant)
        const effectiveStock = getEffectiveStock(item.product, item.variant)

        return {
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          variant_name: item.variant?.name || null,
          name: item.product.name,
          price: getDiscountedPrice(effectivePrice, item.product.discount_percentage || 0),
          quantity: item.quantity,
          type: effectiveStock > 0 ? 'in_stock' : 'pre_order' as const
        }
      })

      const orderData = {
        customer_name: formData.customer_name.trim(),
        phone: fullPhone,
        email: formData.email.trim() || null,
        items: orderItems,
        total: totalWithShipping,
        province: formData.shipping_method !== 'pickup' ? formData.province : null,
        canton: formData.shipping_method !== 'pickup' ? formData.canton.trim() : null,
        district: formData.shipping_method !== 'pickup' ? formData.district.trim() : null,
        exact_address: formData.shipping_method !== 'pickup' ? formData.exact_address.trim() : null,
        shipping_method: formData.shipping_method,
        shipping_cost: shippingCost,
        payment_method: formData.payment_method,
        payment_method_name: paymentMethods.find(m => m.id === formData.payment_method)?.name || 'No especificado',
        payment_proof_url: paymentProofUrl,
        billing_same_as_shipping: formData.billing_same_as_shipping,
        billing_name: formData.billing_same_as_shipping ? null : formData.billing_name.trim(),
        billing_province: formData.billing_same_as_shipping ? null : formData.billing_province,
        billing_canton: formData.billing_same_as_shipping ? null : formData.billing_canton.trim(),
        billing_district: formData.billing_same_as_shipping ? null : formData.billing_district.trim(),
        billing_exact_address: formData.billing_same_as_shipping ? null : formData.billing_exact_address.trim(),
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) throw new Error('Error al procesar el pedido')

      const responseData = await response.json()

      setOrderConfirmation({
        orderNumber: responseData.orderNumber || `ORD${Date.now().toString().slice(-6)}`,
        isPreOrder: responseData.isPreOrder || preOrderItems.length > 0,
        advancePayment: responseData.advancePayment || Math.ceil(totalWithShipping * 0.5),
        totalWithShipping: responseData.totalWithShipping || totalWithShipping,
      })
      setIsSuccess(true)
      clearCart()
    } catch (error) {
      console.error('Order submission error:', error)
      setErrors({ phone: 'Error al procesar el pedido. Intenta de nuevo.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = <K extends keyof CheckoutFormData>(field: K, value: CheckoutFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden animate-in fade-in slide-up duration-200">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {isSuccess && orderConfirmation ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h3>
            <div className="mt-6 mb-6">
              <p className="text-sm text-gray-500 mb-2">Tu número de orden:</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(orderConfirmation.orderNumber)
                  setCopiedOrderNumber(true)
                  setTimeout(() => setCopiedOrderNumber(false), 2000)
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#e8d1e4] hover:bg-pink-100 rounded-xl transition-colors group"
              >
                <span className="text-2xl font-mono font-bold text-pink-700">{orderConfirmation.orderNumber}</span>
                {copiedOrderNumber ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-pink-400 group-hover:text-pink-700" />}
              </button>
              <p className="text-xs text-gray-400 mt-1">Toca para copiar</p>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false)
                setOrderConfirmation(null)
                onClose()
              }}
              className="w-full py-3 px-6 bg-[#b55ca6] hover:bg-[#9c4a8f] text-white font-semibold rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-pink-700" />
                <h2 className="text-lg font-bold text-gray-900">Finalizar Compra</h2>
              </div>
              <button onClick={onClose} className="p-2 active:bg-gray-100 rounded-full transition-colors touch-target">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto scroll-container" style={{ maxHeight: 'calc(95vh - 180px)' }}>
              <div className="p-4 sm:p-6 space-y-6">
                {/* Contact Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />Información de Contacto
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                      <input
                        type="text"
                        id="customer_name"
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base', errors.customer_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')}
                        placeholder="Tu nombre"
                      />
                      {errors.customer_name && <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>}
                    </div>

                    <div className="flex gap-2">
                      <div className="w-32">
                        <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">País</label>
                        <select
                          id="country_code"
                          value={formData.country_code}
                          onChange={(e) => handleInputChange('country_code', e.target.value)}
                          className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-600 outline-none appearance-none bg-white pr-8 text-sm"
                        >
                          {countries.map((country) => (
                            <option key={country.code} value={country.code}>{country.code}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                          className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base', errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')}
                          placeholder={selectedCountry.placeholder}
                          maxLength={selectedCountry.digits > 0 ? selectedCountry.digits : 15}
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico (opcional)</label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base', errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')}
                        placeholder="tu@email.com"
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                </section>

                {/* Shipping Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />Método de Envío
                  </h3>
                  <div className="space-y-2 mb-4">
                    {isLoadingShippingMethods ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : shippingMethods.length > 0 ? (
                      shippingMethods.map((method) => {
                        const isSelected = formData.shipping_method === method.key
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => handleInputChange('shipping_method', method.key as ShippingMethodKey)}
                            className={clsx('w-full p-3 rounded-xl border-2 text-left transition-all', isSelected ? 'border-pink-600 bg-[#e8d1e4]' : 'border-gray-200 hover:border-gray-300')}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{method.name}</p>
                                {method.description && <p className="text-sm text-gray-500">{method.description}</p>}
                              </div>
                              <span className={clsx('font-semibold', method.price === 0 ? 'text-green-600' : 'text-gray-900')}>
                                {method.price === 0 ? 'Gratis' : formatPrice(method.price)}
                              </span>
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      (Object.keys(SHIPPING_METHODS) as ShippingMethodKey[]).map((key) => {
                        const method = SHIPPING_METHODS[key]
                        const isSelected = formData.shipping_method === key
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleInputChange('shipping_method', key)}
                            className={clsx('w-full p-3 rounded-xl border-2 text-left transition-all', isSelected ? 'border-pink-600 bg-[#e8d1e4]' : 'border-gray-200 hover:border-gray-300')}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{method.name}</p>
                                <p className="text-sm text-gray-500">{method.description}</p>
                              </div>
                              <span className={clsx('font-semibold', method.price === 0 ? 'text-green-600' : 'text-gray-900')}>
                                {method.price === 0 ? 'Gratis' : formatPrice(method.price)}
                              </span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {formData.shipping_method !== 'pickup' && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />Dirección de Entrega
                      </h4>
                      <div>
                        <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                        <select
                          id="province"
                          value={formData.province}
                          onChange={(e) => handleInputChange('province', e.target.value)}
                          className={clsx('w-full px-4 py-3 rounded-xl border-2 outline-none appearance-none bg-white pr-10', errors.province ? 'border-red-300' : 'border-gray-200 focus:border-pink-600')}
                        >
                          <option value="">Seleccionar provincia</option>
                          {COSTA_RICA_PROVINCES.map((province) => (<option key={province} value={province}>{province}</option>))}
                        </select>
                        {errors.province && <p className="mt-1 text-sm text-red-500">{errors.province}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="canton" className="block text-sm font-medium text-gray-700 mb-1">Cantón *</label>
                          <input type="text" id="canton" value={formData.canton} onChange={(e) => handleInputChange('canton', e.target.value)} className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base', errors.canton ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')} placeholder="Ej: San José" />
                          {errors.canton && <p className="mt-1 text-sm text-red-500">{errors.canton}</p>}
                        </div>
                        <div>
                          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">Distrito *</label>
                          <input type="text" id="district" value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base', errors.district ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')} placeholder="Ej: Carmen" />
                          {errors.district && <p className="mt-1 text-sm text-red-500">{errors.district}</p>}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="exact_address" className="block text-sm font-medium text-gray-700 mb-1">Dirección exacta *</label>
                        <textarea id="exact_address" value={formData.exact_address} onChange={(e) => handleInputChange('exact_address', e.target.value)} rows={2} className={clsx('w-full px-4 py-3 rounded-xl border-2 transition-colors outline-none text-base resize-none', errors.exact_address ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-pink-600')} placeholder="Casa, calle, puntos de referencia..." />
                        {errors.exact_address && <p className="mt-1 text-sm text-red-500">{errors.exact_address}</p>}
                      </div>
                    </div>
                  )}
                </section>

                {/* Payment Section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />Método de Pago
                  </h3>
                  {isLoadingPaymentMethods ? (
                    <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                  ) : (
                    <div className="space-y-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handleInputChange('payment_method', method.id)}
                          className={clsx('w-full p-3 rounded-xl border-2 text-left transition-all', formData.payment_method === method.id ? 'border-pink-600 bg-[#e8d1e4]' : 'border-gray-200 hover:border-gray-300')}
                        >
                          <p className="font-medium text-gray-900">{method.name}</p>
                          {method.description && <p className="text-sm text-gray-500">{method.description}</p>}
                        </button>
                      ))}
                      {paymentMethods.length === 0 && <p className="text-sm text-gray-500 py-2">No hay métodos de pago disponibles</p>}
                    </div>
                  )}
                  {errors.payment_method && <p className="mt-1 text-sm text-red-500">{errors.payment_method}</p>}

                  {/* Payment Proof Upload */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante de pago <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-500 mb-2">Sube una captura de pantalla del comprobante de tu pago</p>
                    {paymentProofPreview ? (
                      <div className="relative">
                        <img src={paymentProofPreview} alt="Comprobante" className="w-full h-40 object-cover rounded-xl border-2 border-gray-200" />
                        <button type="button" onClick={() => { setPaymentProof(null); setPaymentProofPreview(null) }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-pink-400 hover:bg-[#e8d1e4] transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Toca para subir imagen</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) { alert('El archivo es muy grande. El tamaño máximo es 5MB.'); return }
                            setPaymentProof(file)
                            setErrors(prev => ({ ...prev, payment_proof: undefined }))
                            const reader = new FileReader()
                            reader.onloadend = () => setPaymentProofPreview(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }} />
                      </label>
                    )}
                    {errors.payment_proof && <p className="mt-2 text-sm text-red-500">{errors.payment_proof}</p>}
                  </div>
                </section>

                {/* Order Total */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {hasPreOrderItems ? (
                    <>
                      {/* Pre-order breakdown */}
                      {inStockItems.length > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Productos disponibles (100%)</span>
                          <span className="text-green-600">{formatPrice(inStockTotal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pre-pedidos (50% adelanto)</span>
                        <span className="text-amber-600">{formatPrice(Math.ceil(preOrderTotal * 0.5))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Envío ({selectedShippingMethod.name})</span>
                        <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Pago inicial requerido</span>
                        <span className="text-pink-700">{formatPrice(advancePaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 pt-1">
                        <span>Saldo pendiente (al entregar)</span>
                        <span>{formatPrice(remainingPaymentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-200 mt-2">
                        <span>Total del pedido</span>
                        <span>{formatPrice(totalWithShipping)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Regular order */}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal productos</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Envío ({selectedShippingMethod.name})</span>
                        <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total a pagar</span>
                        <span className="text-pink-700">{formatPrice(totalWithShipping)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || state.items.length === 0}
                  className={clsx('w-full py-4 rounded-xl font-semibold text-white transition-all touch-target text-base', isSubmitting || state.items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b55ca6] active:bg-[#9c4a8f] active:scale-[0.98]')}
                >
                  {isSubmitting ? (<span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Procesando...</span>) : `Confirmar Pedido - ${formatPrice(hasPreOrderItems ? advancePaymentAmount : totalWithShipping)}`}
                </button>
                {hasPreOrderItems && (
                  <p className="text-xs text-amber-600 text-center">Este pedido requiere un adelanto del 50% para pre-pedidos</p>
                )}
                <p className="text-xs text-gray-500 text-center">Te contactaremos para coordinar el pago y la entrega.</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}