import { NextResponse, type NextRequest } from 'next/server'
import { processWhatsAppMessage } from '@/lib/whatsapp/bot-engine'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

interface BotRule {
  id: string
  triggerWords: string[]
  responseTemplate: string
  category: 'Billing' | 'Wi-Fi' | 'Food' | 'Support' | 'Gate Pass' | 'Owner Insights'
  isActive: boolean
}

const DEFAULT_RULES: BotRule[] = [
  {
    id: 'rule_01',
    triggerWords: ['balance', 'rent', 'due', 'pending', 'fees', 'invoice', 'bill'],
    responseTemplate:
      'Hi {{name}}! 👋 Your current outstanding rent balance is *₹{{balance}}* for Room {{room}}. You can pay instantly using our UPI handle: `pgsetu@icici` or via the tenant passbook portal: https://pgsetu.com/portal',
    category: 'Billing',
    isActive: true,
  },
  {
    id: 'rule_02',
    triggerWords: ['wifi', 'wi-fi', 'internet', 'password', 'speed'],
    responseTemplate:
      '📶 *PG-Setu High-Speed Fiber*\nSSID: `PG-SETU-HIGH-SPEED-5G`\nPassword: `SecureStay@2026`\nFor router resets or low speeds, please reply with "Complaint: Wi-Fi slow".',
    category: 'Wi-Fi',
    isActive: true,
  },
  {
    id: 'rule_03',
    triggerWords: ['food', 'menu', 'dinner', 'lunch', 'breakfast', 'khana'],
    responseTemplate:
      '🍲 *Today\'s Mess Menu*\n• Breakfast: Poha with Peanuts & Mint Chutney\n• Lunch: Phulka Rotis, Dal Tadka, Aloo Gobhi & Steamed Jeera Rice\n• Dinner: Chapati, Paneer Butter Masala & Gulab Jamun\nEnjoy your meal! 🍽️',
    category: 'Food',
    isActive: true,
  },
  {
    id: 'rule_04',
    triggerWords: ['complaint', 'repair', 'plumber', 'ac', 'water', 'leak', 'geyser'],
    responseTemplate:
      '🛠️ Ticket Registered: #TKT-{{randomTicket}}\nOur maintenance team has been alerted for your room. A technician will visit within 2 hours. Track status on your portal: https://pgsetu.com/portal',
    category: 'Support',
    isActive: true,
  },
  {
    id: 'rule_05',
    triggerWords: ['gate', 'pass', 'leave', 'night out', 'late', 'entry'],
    responseTemplate:
      '🎫 Digital Gate Pass Generated for {{name}} (Room {{room}}). Security Pass Code: 8492. Show this to the security guard upon entry.',
    category: 'Gate Pass',
    isActive: true,
  },
  {
    id: 'rule_06',
    triggerWords: ['occupancy', 'collections', 'defaulters', 'revenue'],
    responseTemplate:
      '📊 PG-Setu Owner Analytics: Live Bed Capacity, MTD Rent Collections, and Top Overdue Defaulters Summary.',
    category: 'Owner Insights',
    isActive: true,
  },
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      rules: DEFAULT_RULES,
      webhookUrl: 'https://pgsetu.com/api/whatsapp/webhook',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'pgsetu_secure_webhook_token_2026',
      status: 'active',
      cloudApiConfigured: Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_ID),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch bot rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message = '',
      phone = '9876543210',
      residentName = 'Arjun Verma',
      residentId = undefined,
    } = body

    // Route through the real Bot Engine with Supabase connection & intent classification
    const result = await processWhatsAppMessage({
      phone,
      message,
      senderName: residentName,
      residentId,
    })

    // Log outbound reply
    await sendWhatsAppMessage({
      to: phone,
      text: result.replyText,
      organizationId: result.residentData?.organizationId,
      residentId: result.residentData?.id,
    })

    return NextResponse.json({
      success: true,
      senderPhone: result.senderPhone,
      senderRole: result.senderRole,
      intent: result.intent,
      residentData: result.residentData,
      query: message,
      reply: result.replyText,
      ticketCreated: result.ticketCreated,
      timestamp: result.timestamp,
    })
  } catch (error: any) {
    console.error('Bot processing failed in erp route:', error)
    return NextResponse.json({ error: error?.message || 'Bot processing failed' }, { status: 500 })
  }
}
