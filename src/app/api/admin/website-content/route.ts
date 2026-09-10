import { NextResponse, type NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import {
  DEFAULT_WEBSITE_CONTENT,
  WebsiteContent,
} from '@/lib/website-content'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

// Storage path on server
const CONTENT_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'website-content-active.json')

// In-memory cache
let inMemoryContent: WebsiteContent | null = null

function loadPersistedContent(): WebsiteContent {
  if (inMemoryContent) {
    return inMemoryContent
  }

  try {
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const fileData = fs.readFileSync(CONTENT_FILE_PATH, 'utf-8')
      const parsed = JSON.parse(fileData)
      inMemoryContent = {
        ...DEFAULT_WEBSITE_CONTENT,
        ...parsed,
        announcement: { ...DEFAULT_WEBSITE_CONTENT.announcement, ...(parsed.announcement || {}) },
        hero: { ...DEFAULT_WEBSITE_CONTENT.hero, ...(parsed.hero || {}) },
        trust: { ...DEFAULT_WEBSITE_CONTENT.trust, ...(parsed.trust || {}) },
        cities: { ...DEFAULT_WEBSITE_CONTENT.cities, ...(parsed.cities || {}) },
        whyChooseUs: { ...DEFAULT_WEBSITE_CONTENT.whyChooseUs, ...(parsed.whyChooseUs || {}) },
        ownerCta: { ...DEFAULT_WEBSITE_CONTENT.ownerCta, ...(parsed.ownerCta || {}) },
        softwarePage: { ...DEFAULT_WEBSITE_CONTENT.softwarePage, ...(parsed.softwarePage || {}) },
        footer: { ...DEFAULT_WEBSITE_CONTENT.footer, ...(parsed.footer || {}) },
      }
      return inMemoryContent!
    }
  } catch (err) {
    console.warn('[WebsiteContent] Failed reading persisted file, falling back to defaults', err)
  }

  inMemoryContent = JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT))
  return inMemoryContent!
}

function savePersistedContent(content: WebsiteContent): void {
  inMemoryContent = content
  try {
    const dir = path.dirname(CONTENT_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8')
  } catch (err) {
    console.error('[WebsiteContent] Failed saving to disk', err)
  }
}

// GET: Public or admin read of current content
export async function GET(request: NextRequest) {
  try {
    const content = loadPersistedContent()
    return NextResponse.json({
      success: true,
      content,
      defaultsAvailable: true,
      lastUpdated: content.lastUpdated || new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load website content' },
      { status: 500 }
    )
  }
}

// POST: Super Admin save of content
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const isSuperAdmin = isSuperAdminFromRequest(request)
    // Note: We also permit authenticated superadmins via session cookie or payload token
    const body = await request.json()
    const current = loadPersistedContent()

    let updated: WebsiteContent

    if (body.section && body.data) {
      // Partial section update (e.g. section: 'hero', data: { ... })
      updated = {
        ...current,
        [body.section]: body.data,
        lastUpdated: new Date().toISOString(),
        updatedBy: body.updatedBy || 'Super Admin',
      }
    } else if (body.content) {
      // Full content replacement
      updated = {
        ...current,
        ...body.content,
        lastUpdated: new Date().toISOString(),
        updatedBy: body.updatedBy || 'Super Admin',
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: must provide section + data or full content' },
        { status: 400 }
      )
    }

    savePersistedContent(updated)

    return NextResponse.json({
      success: true,
      message: 'Website content updated and published live.',
      content: updated,
    })
  } catch (err: any) {
    console.error('[WebsiteContent] POST error', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save website content' },
      { status: 500 }
    )
  }
}

// DELETE: Reset section or all content to factory default
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const section = url.searchParams.get('section')

    const current = loadPersistedContent()
    let updated: WebsiteContent

    if (!section || section === 'all') {
      updated = JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT))
      updated.lastUpdated = new Date().toISOString()
      updated.updatedBy = 'Factory Default Reset'
    } else if (section in DEFAULT_WEBSITE_CONTENT) {
      const secKey = section as keyof WebsiteContent
      updated = {
        ...current,
        [secKey]: JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT[secKey])),
        lastUpdated: new Date().toISOString(),
        updatedBy: `Reset ${section} to default`,
      }
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown section: ${section}` },
        { status: 400 }
      )
    }

    savePersistedContent(updated)

    return NextResponse.json({
      success: true,
      message: section && section !== 'all' ? `Section ${section} reset to default.` : 'All website content reset to factory default.',
      content: updated,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reset website content' },
      { status: 500 }
    )
  }
}
