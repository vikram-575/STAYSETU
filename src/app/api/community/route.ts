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
  global.__pgsetu_community_posts__ = [
    {
      id: 'post_01',
      title: 'Ergonomic Study Chair + Table Set (Barely Used)',
      category: 'buy_sell',
      description: 'Moving out next month. Selling my Green Soul ergonomic chair and compact folding study table in pristine condition.',
      priceRupees: 2800,
      contactName: 'Vivek K.',
      contactPhone: '9876543210',
      roomNumber: '302',
      pgCluster: 'Electronic City Phase 1',
      imageUrl: 'https://images.unsplash.com/photo-1580481077197-90c7499638b9?w=600&auto=format&fit=crop&q=80',
      likes: 12,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: 'post_02',
      title: 'Looking for a Vegetarian Roommate for Double Sharing',
      category: 'roommate',
      description: 'Room 204 has 1 bed vacant. Looking for an IT professional or student who maintains quiet hours during weeknights.',
      priceRupees: 7500,
      contactName: 'Aditya Mehta',
      contactPhone: '9845123678',
      roomNumber: '204',
      pgCluster: 'Electronic City Phase 1',
      likes: 8,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: 'post_03',
      title: 'Weekend Turf Cricket Tournament (Need 3 Players)',
      category: 'event',
      description: 'Friendly 7-a-side box cricket tournament this Sunday 7:00 AM at Smash Turf. Free refreshments!',
      contactName: 'Sports Club',
      contactPhone: '9988776655',
      pgCluster: 'South City Cluster',
      likes: 24,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
    {
      id: 'post_04',
      title: 'Lost Boat Airdopes Earbuds Case (Black)',
      category: 'lost_found',
      description: 'Misplaced in the 2nd-floor dining hall on Thursday evening. If found, please reach out or hand over to warden.',
      contactName: 'Sneha R.',
      contactPhone: '9711223344',
      roomNumber: '108',
      pgCluster: 'Electronic City Phase 1',
      likes: 5,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    },
  ]
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
