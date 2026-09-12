import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

interface WhiteLabelConfig {
  brandName: string
  logoUrl: string
  primaryColor: string
  customDomain: string
  cnameVerified: boolean
  invoiceTagline: string
  supportEmail: string
  supportPhone: string
  smsSenderId: string
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_whitelabel_config__: WhiteLabelConfig | undefined
}

if (!global.__pgsetu_whitelabel_config__) {
  global.__pgsetu_whitelabel_config__ = {
    brandName: 'Royal Stays & Co-Living',
    logoUrl: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=120&auto=format&fit=crop&q=80',
    primaryColor: '#16A34A',
    customDomain: 'portal.royalstays.in',
    cnameVerified: true,
    invoiceTagline: 'Premium Co-Living Accommodation & Executive Hostels',
    supportEmail: 'contact@royalstays.in',
    supportPhone: '9845012345',
    smsSenderId: 'RYLSTY',
  }
}

export async function GET(request: NextRequest) {
  try {
    const config = global.__pgsetu_whitelabel_config__
    return NextResponse.json({
      success: true,
      config,
      dnsInstructions: {
        type: 'CNAME',
        host: 'portal.royalstays.in',
        target: 'cname.pgsetu.com',
        ttl: '3600',
        sslStatus: 'Active (Auto-provisioned Let\'s Encrypt SSL)',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch white label config' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const config = global.__pgsetu_whitelabel_config__!

    if (body.brandName) config.brandName = body.brandName
    if (body.primaryColor) config.primaryColor = body.primaryColor
    if (body.customDomain) config.customDomain = body.customDomain
    if (body.invoiceTagline) config.invoiceTagline = body.invoiceTagline
    if (body.supportEmail) config.supportEmail = body.supportEmail
    if (body.supportPhone) config.supportPhone = body.supportPhone
    if (body.smsSenderId) config.smsSenderId = body.smsSenderId

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save config' }, { status: 500 })
  }
}
