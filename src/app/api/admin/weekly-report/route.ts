import { NextResponse } from 'next/server'
import { getCurrentCycle, getCycleOrders, generateWeeklyReport, sendWeeklyReportTelegram, closeCurrentCycleAndCreateNew } from '@/lib/weekly-report'

export async function GET() {
  try {
    const currentCycle = await getCurrentCycle()

    if (!currentCycle) {
      return NextResponse.json({ error: 'No open week cycle found' }, { status: 400 })
    }

    const orders = await getCycleOrders(currentCycle.id)
    const report = generateWeeklyReport(currentCycle, orders)

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report preview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const currentCycle = await getCurrentCycle()

    if (!currentCycle) {
      return NextResponse.json({ error: 'No open week cycle found' }, { status: 400 })
    }

    const orders = await getCycleOrders(currentCycle.id)
    const report = generateWeeklyReport(currentCycle, orders)

    await sendWeeklyReportTelegram(report)
    await closeCurrentCycleAndCreateNew(currentCycle.id)

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}