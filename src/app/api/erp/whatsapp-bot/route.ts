import { NextResponse, type NextRequest } from 'next/server'

interface BotRule {
  id: string
  triggerWords: string[]
  responseTemplate: string
  category: 'Billing' | 'Wi-Fi' | 'Food' | 'Support'
  isActive: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_whatsapp_bot_rules__: BotRule[] | undefined
}

if (!global.__pgsetu_whatsapp_bot_rules__) {
  global.__pgsetu_whatsapp_bot_rules__ = [
    {
      id: 'rule_01',
      triggerWords: ['balance', 'rent', 'due', 'pending', 'fees', 'invoice'],
      responseTemplate:
        'Hi {{name}}! 👋 Your current outstanding rent balance is *₹{{balance}}* for Room {{room}}. You can pay instantly using our UPI handle: `pgsetu@icici` or via the tenant passbook portal: https://pgsetu.com/portal',
      category: 'Billing',
      isActive: true,
    },
    {
      id: 'rule_02',
      triggerWords: ['wifi', 'wi-fi', 'internet', 'password', 'speed'],
      responseTemplate:
        '📶 *PG-Setu High-Speed Fiber*\nSSID: `PG-SETU-5G-ZONE`\nPassword: `SecureStay@2025`\nFor router resets or low speeds, please reply with "Complaint".',
      category: 'Wi-Fi',
      isActive: true,
    },
    {
      id: 'rule_03',
      triggerWords: ['food', 'menu', 'dinner', 'lunch', 'breakfast', 'khana'],
      responseTemplate:
        '🍲 *Today\'s Mess Menu*\n• Breakfast: Poha with Peanuts & Mint Chutney\n• Lunch: Phulka Rotis, Dal Tadka, Aloo Gobhi & Steamed Jeera Rice\n• Dinner: Chapati, Paneer Butter Masala & Kheer Dessert\nEnjoy your meal! 🍽️',
      category: 'Food',
      isActive: true,
    },
    {
      id: 'rule_04',
      triggerWords: ['complaint', 'repair', 'plumber', 'ac', 'water', 'leak'],
      responseTemplate:
        '🛠️ Ticket Registered: #TKT-{{randomTicket}}\nOur maintenance team has been alerted for your room. A technician will visit within 2 hours. Track status on your portal: https://pgsetu.com/portal',
      category: 'Support',
      isActive: true,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const rules = global.__pgsetu_whatsapp_bot_rules__ || []
    return NextResponse.json({
      success: true,
      rules,
      webhookUrl: 'https://pgsetu.com/api/erp/whatsapp-bot',
      status: 'active',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch bot rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message = '', residentName = 'Arjun Verma', roomNumber = '204-B' } = body
    const rules = global.__pgsetu_whatsapp_bot_rules__ || []

    const cleanMsg = message.toLowerCase().trim()
    let matchedReply = ''

    for (const rule of rules) {
      if (!rule.isActive) continue
      const hasMatch = rule.triggerWords.some((word) => cleanMsg.includes(word))
      if (hasMatch) {
        matchedReply = rule.responseTemplate
          .replace('{{name}}', residentName)
          .replace('{{room}}', roomNumber)
          .replace('{{balance}}', '12,000')
          .replace('{{randomTicket}}', Math.floor(1000 + Math.random() * 9000).toString())
        break
      }
    }

    if (!matchedReply) {
      matchedReply = `Hello ${residentName}! I am your automated PG-Setu Assistant. 🤖\nYou can ask me:\n• *"What is my rent balance?"*\n• *"Send Wi-Fi password"*\n• *"Today's food menu"*\n• *"Register a maintenance complaint"*`
    }

    return NextResponse.json({
      success: true,
      query: message,
      reply: matchedReply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Bot processing failed' }, { status: 500 })
  }
}
