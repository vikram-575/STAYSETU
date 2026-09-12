'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MessageSquare, ShoppingBag, Users, Calendar, HelpCircle,
  Plus, Search, ThumbsUp, Phone, MapPin, Tag, ArrowLeft,
  Loader2, CheckCircle2, Image as ImageIcon, X
} from 'lucide-react'

export default function CommunityBoardPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('buy_sell')
  const [description, setDescription] = useState('')
  const [priceRupees, setPriceRupees] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (selectedCategory !== 'all') query.set('category', selectedCategory)
      if (searchQuery) query.set('search', searchQuery)

      const res = await fetch(`/api/community?${query.toString()}`)
      const data = await res.json()
      if (res.ok) setPosts(data.posts || [])
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  const handleLike = async (id: string) => {
    try {
      await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like', id }),
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      )
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          priceRupees: priceRupees ? Number(priceRupees) : undefined,
          contactName,
          contactPhone,
          roomNumber,
        }),
      })
      if (res.ok) {
        setIsModalOpen(false)
        setTitle('')
        setDescription('')
        setPriceRupees('')
        fetchPosts()
      }
    } catch {
      alert('Error creating listing')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [
    { id: 'all', label: 'All Listings', icon: MessageSquare },
    { id: 'buy_sell', label: 'Buy & Sell', icon: ShoppingBag },
    { id: 'roommate', label: 'Flatmates & Rooms', icon: Users },
    { id: 'event', label: 'Events & Sports', icon: Calendar },
    { id: 'lost_found', label: 'Lost & Found', icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#17211B]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
                  CAMPUS
                </span>
                <h1 className="text-base font-black text-gray-900">Resident Community Board</h1>
              </div>
              <p className="text-[11px] text-gray-500">Buy, sell, connect with roommates, and campus announcements</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#16A34A] hover:bg-[#14532D] text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Post an Item
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Category Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => {
              const Icon = c.icon
              const isSelected = selectedCategory === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-[#14532D] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              )
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchPosts()
            }}
            className="relative w-full md:w-72"
          >
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, books, events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
            />
          </form>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-900">No posts in this category yet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Be the first to list a study chair, book, or event announcement!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
                      {post.category.replace('_', ' ')}
                    </span>
                    {post.priceRupees !== undefined && (
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        ₹{post.priceRupees.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5">{post.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-3 mb-4">{post.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-800 text-[11px] flex items-center gap-1">
                      {post.contactName} {post.roomNumber && <span className="text-gray-400 font-normal">({post.roomNumber})</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" /> {post.pgCluster}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-bold transition"
                    >
                      <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      <span>{post.likes}</span>
                    </button>
                    <a
                      href={`https://wa.me/91${post.contactPhone}?text=Hi%20${encodeURIComponent(post.contactName)},%20I%20saw%20your%20post%20on%20PG-Setu%20Community:%20${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A] hover:text-white transition"
                      title="Contact on WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900">Create Community Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Post Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Selling Electric Kettle or Looking for Roommate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="buy_sell">Buy & Sell</option>
                    <option value="roommate">Roommate / Bed Vacancy</option>
                    <option value="event">Campus Event / Sports</option>
                    <option value="lost_found">Lost & Found</option>
                    <option value="general">General Notice</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price (₹, Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1500"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide condition, specs, location, or timing details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Arjun"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Room No</label>
                  <input
                    type="text"
                    placeholder="204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16A34A] text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish to Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
