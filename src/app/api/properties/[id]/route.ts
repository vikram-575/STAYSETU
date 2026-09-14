import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const origin = request.nextUrl.origin || 'http://localhost:3000'
    const res = await fetch(`${origin}/api/properties?id=${encodeURIComponent(id)}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    if (!data.success || !data.property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 })
  }
}
