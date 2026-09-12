'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare, Bot, Send, Sparkles, CheckCircle2,
  Copy, Check, Phone, Wifi, Utensils, Wrench, Loader2
} from 'lucide-react'

export default function WhatsAppBotPage() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // Interactive Simulator Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello Arjun! 👋 I am your 24/7 PG-Setu Assistant. How can I help you today? You can ask about your pending rent, Wi-Fi password, or today\'s meal menu.',
      time: '10:00 AM',
    },
  ])
  const [userInput, setUserInput] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => {
    async function fetchRules() {
      try {
        setLoading(true)
        const res = await fetch('/api/erp/whatsapp-bot')
        const data = await res.json()
        if (res.ok) setRules(data.rules || [])
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const userText = userInput.trim()
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: nowTime }])
    setUserInput('')
    setSendingMsg(true)

    try {
      const res = await fetch('/api/erp/whatsapp-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, residentName: 'Arjun Verma', roomNumber: '204-B' }),
      })
      const data = await res.json()
      if (res.ok && data.reply) {
        setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply, time: data.timestamp }])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I am having trouble connecting right now.', time: nowTime },
      ])
    } finally {
      setSendingMsg(false)
    }
  }

  const quickPrompts = [
    'What is my rent due?',
    'What is the Wi-Fi password?',
    'What is for dinner today?',
    'My AC is leaking, need repair',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              AI SELF-SERVICE
            </span>
            <h1 className="text-xl font-black text-gray-900">AI WhatsApp Conversational Bot for Residents</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            24/7 automated instant responses for rent balances, UPI links, Wi-Fi credentials, daily mess menus, and complaint logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://pgsetu.com/api/erp/whatsapp-bot')
              setCopiedWebhook(true)
              setTimeout(() => setCopiedWebhook(false), 2000)
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            <span>Copy Webhook URL</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules & Triggers Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900">Configured Auto-Response Rules</h3>
            <span className="text-xs text-gray-500">{rules.length} Rules Active</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {rule.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Active
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Trigger Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.triggerWords.map((w: string) => (
                        <span key={w} className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-mono text-gray-700">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-xl text-xs text-gray-700 whitespace-pre-line font-sans border border-gray-100">
                    {rule.responseTemplate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Mobile Simulator */}
        <div className="bg-[#ECE5DD] rounded-3xl p-4 border border-gray-300 shadow-lg flex flex-col h-[560px] justify-between relative overflow-hidden">
          {/* WhatsApp Header Bar */}
          <div className="bg-[#075E54] text-white p-3 rounded-2xl flex items-center gap-3 shadow-md -mx-1 -mt-1 mb-2">
            <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center font-black text-[#075E54]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold leading-tight">PG-Setu Resident Bot</h4>
              <p className="text-[10px] text-emerald-200">Official Automated Business Account</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 p-2 scrollbar-thin">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#DCF8C6] text-gray-900 rounded-br-xs'
                      : 'bg-white text-gray-900 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                  <span className="block text-[9px] text-gray-400 text-right mt-1 font-mono">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {sendingMsg && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/70 px-3 py-1 rounded-full w-max">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                <span>Assistant is typing...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => setUserInput(qp)}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-gray-800 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-xs border border-gray-200"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Type a resident message to test..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white text-xs text-gray-900 rounded-full shadow-xs focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
            <button
              type="submit"
              disabled={sendingMsg || !userInput.trim()}
              className="w-10 h-10 rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white flex items-center justify-center shadow-md transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
