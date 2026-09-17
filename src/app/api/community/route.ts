import { NextResponse, type NextRequest } from 'next/server'

interface CommunityPost {
  id: string
  title: string
  category: 'buy_sell' | 'roommate' | 'event' | 'lost_found' | 'general'
  description: string
  priceRupees?: number
  contactName: string
  contactPhone: string
  roomNumber?: string
  pgCluster: string
  imageUrl?: string
  likes: number
  createdAt: string
  status: 'active' | 'sold' | 'closed'
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_community_posts__: CommunityPost[] | undefined
}

if (!global.__pgsetu_community_posts__) {
  global.__pgsetu_community_posts__ = []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.toLowerCase()

    let posts = global.__pgsetu_community_posts__ || []

    if (category && category !== 'all') {
      posts = posts.filter((p) => p.category === category)
    }

    if (search) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.pgCluster.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({ success: true, posts })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'create', id } = body

    const posts = global.__pgsetu_community_posts__ || []

    if (action === 'like') {
      const post = posts.find((p) => p.id === id)
      if (post) post.likes += 1
      return NextResponse.json({ success: true, post })
    }

    if (action === 'mark_sold') {
      const post = posts.find((p) => p.id === id)
      if (post) post.status = 'sold'
      return NextResponse.json({ success: true, post })
    }

    // Create New Post
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      title: body.title || 'Untitled Post',
      category: body.category || 'buy_sell',
      description: body.description || '',
      priceRupees: body.priceRupees ? Number(body.priceRupees) : undefined,
      contactName: body.contactName || 'Resident',
      contactPhone: body.contactPhone || '9876543210',
      roomNumber: body.roomNumber || '',
      pgCluster: body.pgCluster || 'Main Campus Cluster',
      imageUrl: body.imageUrl || undefined,
      likes: 0,
      createdAt: new Date().toISOString(),
      status: 'active',
    }

    posts.unshift(newPost)
    return NextResponse.json({ success: true, post: newPost })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create post' }, { status: 500 })
  }
}
