import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'
import { getVariantsByProductId, createVariant } from '@/lib/demo-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ variants: getVariantsByProductId(id) })
    }

    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
    }

    return NextResponse.json({ variants })
  } catch (error) {
    console.error('Variants fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getSupabase()

    const variantData = {
      product_id: id,
      name: body.name,
      sku: body.sku || null,
      price: body.price,
      stock: body.stock || 0,
      is_default: body.is_default || false,
      sort_order: body.sort_order || 0,
    }

    if (!supabase) {
      const variant = createVariant(variantData)
      return NextResponse.json({ variant })
    }

    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert(variantData as never)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
    }

    return NextResponse.json({ variant })
  } catch (error) {
    console.error('Variant creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}