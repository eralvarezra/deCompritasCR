import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase/api'

interface CategoryData {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    const supabase = getSupabase()

    if (!supabase) {
      const defaultCategories = getDefaultCategories()
      return NextResponse.json({ categories: defaultCategories })
    }

    const { data: allCategories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    const categories = allCategories as CategoryData[]
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, parent_id, sort_order } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    let finalSlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    let slugExists = true
    let slugCounter = 0
    let testSlug = finalSlug

    while (slugExists) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', testSlug)
        .single()

      if (!existing) {
        slugExists = false
        finalSlug = testSlug
      } else {
        slugCounter++
        testSlug = `${finalSlug}-${slugCounter}`
      }
    }

    const insertData = {
      name,
      slug: finalSlug,
      parent_id: parent_id || null,
      sort_order: sort_order || 0,
      is_active: true,
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create category', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultCategories() {
  return [
    { id: 'skin-care', name: 'Skin Care', slug: 'skin-care', parent_id: null, sort_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'limpiadores', name: 'Limpiadores', slug: 'limpiadores', parent_id: 'skin-care', sort_order: 1, is_active: true, created_at: '', updated_at: '' },
    { id: 'tonicos', name: 'Tónicos', slug: 'tonicos', parent_id: 'skin-care', sort_order: 2, is_active: true, created_at: '', updated_at: '' },
    { id: 'serums', name: 'Sérums', slug: 'serums', parent_id: 'skin-care', sort_order: 3, is_active: true, created_at: '', updated_at: '' },
    { id: 'hidratantes', name: 'Hidratantes', slug: 'hidratantes', parent_id: 'skin-care', sort_order: 4, is_active: true, created_at: '', updated_at: '' },
  ]
}