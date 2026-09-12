'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare, Bot, Send, Sparkles, CheckCircle2,
  Copy, Check, Phone, Wifi, Utensils, Wrench, Loader2,
  Calendar, AlertTriangle, Users, Shield, RefreshCw, Radio,
  Clock, ArrowRight, ExternalLink, Activity, Info
} from 'lucide-react'

export default function WhatsAppBotPage() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'cadence' | 'broadcast' | 'logs' | 'config'>('simulator')
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [pinging, setPinging] = useState(false)

  // Real Residents List for Switcher
  const [residentList, setResidentList] = useState<any[]>([])
  const [selectedResident, setSelectedResident] = useState<any>({
    resident_id: 'res_demo_1',
    full_name: 'Arjun Verma',
    phone: '9876543210',
    room_number: '204-B',
    total_outstanding_paise: 1200000,
  })
  const [isOwnerSimulatorMode, setIsOwnerSimulatorMode] = useState(false)

  // Interactive Simulator Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'bot'
    text: string
    time: string
    intent?: string
    ticketId?: string
  }>>([
    {
      sender: 'bot',
      text: 'Hello Arjun! 👋 I am your 24/7 PG-Setu Assistant. How can I help you today? You can check your pending rent, Wi-Fi password, today\'s meal menu, or log a maintenance request.',
      time: '10:00 AM',
    },
  ])
  const [userInput, setUserInput] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Cadence State
  const [cadenceData, setCadenceData] = useState<any>(null)
  const [loadingCadence, setLoadingCadence] = useState(false)
  const [runningCadence, setRunningCadence] = useState(false)
  const [cadenceResults, setCadenceResults] = useState<any[] | null>(null)
  const [cadenceTier, setCadenceTier] = useState<number>(1)
  const [cadenceDryRun, setCadenceDryRun] = useState<boolean>(true)

  // Broadcast State
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'defaulters' | 'room'>('all')
  const [broadcastRoom, setBroadcastRoom] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('Important Notice for {{name}} in Room {{room}}: Water tank cleaning is scheduled tomorrow from 10:00 AM to 1:00 PM. Please store sufficient drinking water.')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [broadcastStatus, setBroadcastStatus] = useState<any | null>(null)

  // Message Logs State
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true)
        const [rulesRes, resSearch] = await Promise.all([
          fetch('/api/erp/whatsapp-bot'),
          fetch('/api/residents/search?q=a').catch(() => null),
        ])

        const rulesData = await rulesRes.json()
        if (rulesRes.ok) setRules(rulesData.rules || [])

        if (resSearch && resSearch.ok) {
          const rData = await resSearch.json()
          if (rData.residents && rData.residents.length > 0) {
            setResidentList(rData.residents)
            setSelectedResident(rData.residents[0])
            setChatMessages([
              {
                sender: 'bot',
                text: `Hello ${rData.residents[0].full_name}! 👋 I am your 24/7 PG-Setu Assistant. How can I help you today? You can check your pending rent, Wi-Fi password, or today's food menu.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
        }
      } catch (e) {
        console.error('Init data load error:', e)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [])

  // Load Cadence Data when tab is selected
  useEffect(() => {
    if (activeTab === 'cadence' && !cadenceData) {
      loadCadence()
    } else if (activeTab === 'logs') {
      loadLogs()
    }
  }, [activeTab])

  const loadCadence = async () => {
    try {
      setLoadingCadence(true)
      const res = await fetch('/api/whatsapp/reminders')
      const data = await res.json()
      if (res.ok) setCadenceData(data)
    } catch {} finally {
      setLoadingCadence(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLoadingLogs(true)
      const res = await fetch('/api/whatsapp/logs')
      const data = await res.json()
      if (res.ok) setLogs(data.logs || [])
    } catch {} finally {
      setLoadingLogs(false)
    }
  }

  // Handle Simulator Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim()) return

    const userText = userInput.trim()
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: nowTime }])
    setUserInput('')
    setSendingMsg(true)

    try {
      const payload: any = {
        message: userText,
        phone: isOwnerSimulatorMode ? '9999900000' : selectedResident.phone || '9876543210',
        residentName: isOwnerSimulatorMode ? 'Property Owner' : selectedResident.full_name,
        residentId: isOwnerSimulatorMode ? undefined : selectedResident.resident_id,
      }

      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: data.reply,
            time: data.timestamp || nowTime,
            intent: data.intent,
            ticketId: data.ticketCreated?.id,
          },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I am having trouble connecting right now. Please try again.', time: nowTime },
      ])
    } finally {
      setSendingMsg(false)
    }
  }

  // Handle Cadence Run
  const handleRunCadence = async () => {
    try {
      setRunningCadence(true)
      const res = await fetch('/api/whatsapp/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: cadenceTier, dryRun: cadenceDryRun }),
      })
      const data = await res.json()
      if (res.ok) {
        setCadenceResults(data.results || [])
      }
    } catch (err) {
      console.error('Cadence trigger error:', err)
    } finally {
      setRunningCadence(false)
    }
  }

  // Handle Broadcast Dispatch
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) return
    try {
      setSendingBroadcast(true)
      setBroadcastStatus(null)
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: broadcastAudience,
          roomNumber: broadcastRoom || undefined,
          message: broadcastMessage,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBroadcastStatus(data)
      } else {
        alert(data.error || 'Failed to dispatch broadcast')
      }
    } catch (err) {
      console.error('Broadcast error:', err)
    } finally {
      setSendingBroadcast(false)
    }
  }

  // Handle Webhook Health Ping
  const handleTestWebhookPing = async () => {
    try {
      setPinging(true)
      setPingResult(null)
      const res = await fetch('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=pgsetu_secure_webhook_token_2026&hub.challenge=CHALLENGE_ACCEPTED_2026')
      const text = await res.text()
      if (res.status === 200 && text.includes('CHALLENGE_ACCEPTED_2026')) {
        setPingResult('✅ Webhook Health Verified: Meta Challenge Handshake Passed (HTTP 200 OK)')
      } else {
        setPingResult(`⚠️ Response: HTTP ${res.status} — ${text}`)
      }
    } catch (err: any) {
      setPingResult(`❌ Health Ping Failed: ${err?.message}`)
    } finally {
      setPinging(false)
    }
  }

  const residentQuickPrompts = [
    'What is my rent due?',
    'What is the Wi-Fi password?',
    'What is for dinner today?',
    'Complaint: Geyser leaking in my bathroom',
    'Generate late night Gate Pass',
    'Show last payment receipt',
  ]

  const ownerQuickPrompts = [
    'Show live occupancy',
    'Show collections today',
    'List top rent defaulters',
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              AI CONVERSATIONAL ERP
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Meta Cloud API Ready
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            AI WhatsApp Bot Studio & Automation Engine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
            24/7 automated self-service bot for rent balances, UPI deep links, Wi-Fi credentials, mess menus, complaint ticketing, automated reminder cadence, and broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://pgsetu.com/api/whatsapp/webhook')
              setCopiedWebhook(true)
              setTimeout(() => setCopiedWebhook(false), 2000)
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition"
          >
            {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            <span>Copy Webhook URL</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none border border-gray-200/60">
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-emerald-600" />
          <span>Interactive Bot Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('cadence')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'cadence'
              ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Automated Rent Cadence</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-purple-600" />
          <span>Bulk Broadcasts</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span>Delivery Logs & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'config'
              ? 'bg-white text-emerald-950 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-gray-600" />
          <span>Meta Cloud API & Webhook</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Context Switcher & Active Trigger Rules */}
          <div className="lg:col-span-5 space-y-4">
            {/* Identity Switcher Card */}
            <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Simulate Testing Persona
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {isOwnerSimulatorMode ? '🏢 Owner Persona' : '👤 Resident Persona'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOwnerSimulatorMode(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                    !isOwnerSimulatorMode
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Test as Resident
                </button>
                <button
                  type="button"
                  onClick={() => setIsOwnerSimulatorMode(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                    isOwnerSimulatorMode
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Test as PG Owner
                </button>
              </div>

              {!isOwnerSimulatorMode && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Select Resident Stay Record:</label>
                  <select
                    className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    value={selectedResident?.resident_id || ''}
                    onChange={(e) => {
                      const found = residentList.find((r) => r.resident_id === e.target.value)
                      if (found) {
                        setSelectedResident(found)
                        setChatMessages((prev) => [
                          ...prev,
                          {
                            sender: 'bot',
                            text: `Switched simulator context to *${found.full_name}* (Room ${found.room_number || 'N/A'}). Outstanding Balance: ₹${Math.round((found.total_outstanding_paise || 0) / 100).toLocaleString('en-IN')}. What would you like to ask?`,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ])
                      }
                    }}
                  >
                    {residentList.length > 0 ? (
                      residentList.map((r) => (
                        <option key={r.resident_id} value={r.resident_id}>
                          {r.full_name} — Room {r.room_number || 'N/A'} (Due: ₹{Math.round((r.total_outstanding_paise || 0) / 100).toLocaleString('en-IN')})
                        </option>
                      ))
                    ) : (
                      <option value="demo">Arjun Verma — Room 204-B (Due: ₹12,000)</option>
                    )}
                  </select>

                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 space-y-0.5">
                    <p className="font-bold">Active Stay Metadata:</p>
                    <p>• Room: <span className="font-mono font-bold">{selectedResident?.room_number || '204-B'}</span></p>
                    <p>• Phone: <span className="font-mono">{selectedResident?.phone || '9876543210'}</span></p>
                    <p>• Live Ledger Balance: <span className="font-bold text-rose-700">₹{Math.round((selectedResident?.total_outstanding_paise || 1200000) / 100).toLocaleString('en-IN')}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Configured Rules Summary */}
            <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Live NLP Intent Classifiers
                </h3>
                <span className="text-[10px] text-gray-400 font-bold">{rules.length} Active</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {rules.map((rule) => (
                  <div key={rule.id} className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                        {rule.category}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rule.triggerWords.slice(0, 4).map((w: string) => (
                        <span key={w} className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-600">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Mobile WhatsApp Simulator */}
          <div className="lg:col-span-7">
            <div className="bg-[#EFEAE2] rounded-3xl p-4 border border-gray-300 shadow-xl flex flex-col h-[650px] justify-between relative overflow-hidden">
              {/* WhatsApp App Header Bar */}
              <div className="bg-[#075E54] text-white p-3 rounded-2xl flex items-center justify-between shadow-md -mx-1 -mt-1 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-300 flex items-center justify-center font-black text-[#075E54] shadow-inner">
                    <Bot className="w-5 h-5 text-emerald-950" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      PG-Setu Smart Bot
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 fill-emerald-500" />
                    </h4>
                    <p className="text-[10px] text-emerald-200">
                      {isOwnerSimulatorMode ? 'Owner Control Channel • Online' : `Chatting with ${selectedResident?.full_name || 'Resident'} • Online`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                    Live Engine
                  </span>
                </div>
              </div>

              {/* Chat Bubbles Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 p-2 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-[#D9FDD3] text-gray-900 rounded-br-xs'
                          : 'bg-white text-gray-900 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}

                      {/* Ticket Badge if created */}
                      {msg.ticketId && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                          <Wrench className="w-3 h-3 text-amber-600" />
                          <span>Complaint logged in database: #{msg.ticketId}</span>
                        </div>
                      )}

                      <span className="block text-[9px] text-gray-400 text-right mt-1 font-mono">
                        {msg.time} {msg.sender === 'user' && '✓✓'}
                      </span>
                    </div>
                  </div>
                ))}

                {sendingMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded-full w-max shadow-2xs backdrop-blur-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>PG-Setu Bot is preparing response...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts Chips */}
              <div className="py-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Click to test instant prompt:</p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(isOwnerSimulatorMode ? ownerQuickPrompts : residentQuickPrompts).map((qp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setUserInput(qp)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-medium rounded-lg border border-gray-300/80 shadow-2xs whitespace-nowrap transition shrink-0"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Bar */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1 border-t border-gray-300/60">
                <input
                  type="text"
                  placeholder={
                    isOwnerSimulatorMode
                      ? 'Type owner command: "Occupancy", "Collections", "Defaulters"...'
                      : 'Type resident query: "Rent balance", "Food menu", "Wi-Fi", "Complaint"...'
                  }
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1 bg-white text-xs px-3.5 py-2.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !userInput.trim()}
                  className="w-10 h-10 rounded-2xl bg-[#00A884] hover:bg-[#008f6f] disabled:opacity-50 text-white flex items-center justify-center shadow-md transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED RENT CADENCE */}
      {activeTab === 'cadence' && (
        <div className="space-y-6">
          {/* Cadence Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Unpaid Defaulters</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {cadenceData?.pendingDefaultersCount ?? '...'} Residents
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Active residents with balance &gt; ₹0</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Pending Collections</span>
              <p className="text-2xl font-black text-gray-900 mt-1">
                ₹{cadenceData?.totalOverdueInr ? cadenceData.totalOverdueInr.toLocaleString('en-IN') : '...'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Eligible for automated WhatsApp collection</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Collection Recovery Mode</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">3-Tier Automated Schedule</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl w-max border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>1-Click UPI Deep-Links Enabled</span>
              </div>
            </div>
          </div>

          {/* Cadence Tier Selector & Manual Trigger */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900">Run Automated Collection Cadence</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sends personalized WhatsApp messages with dynamically calculated dues and direct UPI intent URLs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    checked={cadenceDryRun}
                    onChange={(e) => setCadenceDryRun(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Dry Run (Simulate Only)</span>
                </label>

                <button
                  onClick={handleRunCadence}
                  disabled={runningCadence}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {runningCadence ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Cadence...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Trigger Tier {cadenceTier} Cadence Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cadence Tiers Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setCadenceTier(1)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                  cadenceTier === 1
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Day 1 of Month
                  </span>
                  {cadenceTier === 1 && <span className="text-xs font-bold text-emerald-700">● Selected</span>}
                </div>
                <h4 className="text-xs font-bold text-gray-900">Tier 1: Polite Early Reminder</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  "Hi Arjun! Gentle reminder: Your rent for Room 204-B is due for this month. Pay with 1-click UPI..."
                </p>
              </div>

              <div
                onClick={() => setCadenceTier(2)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                  cadenceTier === 2
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Day 3 of Month
                  </span>
                  {cadenceTier === 2 && <span className="text-xs font-bold text-blue-700">● Selected</span>}
                </div>
                <h4 className="text-xs font-bold text-gray-900">Tier 2: Due Date Alert</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  "Hello Arjun! Today is your rent due date for Room 204-B. Settle today via UPI to avoid late fees..."
                </p>
              </div>

              <div
                onClick={() => setCadenceTier(3)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition space-y-2 ${
                  cadenceTier === 3
                    ? 'border-rose-600 bg-rose-50/50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    Day 5+ of Month
                  </span>
                  {cadenceTier === 3 && <span className="text-xs font-bold text-rose-700">● Selected</span>}
                </div>
                <h4 className="text-xs font-bold text-gray-900">Tier 3: Urgent Overdue Notice</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  "⚠️ URGENT OVERDUE NOTICE: Rent for Room 204-B has an overdue balance. Clear immediately to keep services active..."
                </p>
              </div>
            </div>

            {/* Execution Results */}
            {cadenceResults && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900">
                    Cadence Run Completed: {cadenceResults.length} Messages {cadenceDryRun ? 'Simulated' : 'Dispatched'}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500">Tier {cadenceTier}</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {cadenceResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 text-xs">
                      <div>
                        <span className="font-bold text-gray-900">{r.name}</span>
                        <span className="text-gray-400 ml-2">Room {r.room} • {r.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-rose-600">₹{r.balanceInr.toLocaleString('en-IN')}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px] border border-emerald-200">
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BULK BROADCASTS */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900">Broadcast Composer</h3>

              {/* Audience Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Target Audience:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('all')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      broadcastAudience === 'all'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All Active Residents
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('defaulters')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      broadcastAudience === 'defaulters'
                        ? 'bg-rose-50 border-rose-600 text-rose-900'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Only Defaulters
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience('room')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      broadcastAudience === 'room'
                        ? 'bg-blue-50 border-blue-600 text-blue-900'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Specific Room
                  </button>
                </div>

                {broadcastAudience === 'room' && (
                  <input
                    type="text"
                    placeholder="Enter Room Number (e.g. 204-B)"
                    value={broadcastRoom}
                    onChange={(e) => setBroadcastRoom(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 mt-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Message Composer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Message Body:</label>
                  <span className="text-[10px] text-gray-400">Tokens: &#123;&#123;name&#125;&#125;, &#123;&#123;room&#125;&#125;</span>
                </div>
                <textarea
                  rows={5}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full text-xs font-sans bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                  placeholder="Type broadcast message..."
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Insert Preset Template:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setBroadcastMessage(
                        'Important Notice for {{name}} in Room {{room}}: Water tank cleaning is scheduled tomorrow from 10:00 AM to 1:00 PM. Please store sufficient drinking water.'
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-medium text-gray-700"
                  >
                    🚰 Water Tank Cleaning
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBroadcastMessage(
                        'Festival Dinner Special tonight for {{name}}! 🍛 Paneer Lababdar & Gulab Jamun served between 8:00 PM - 10:30 PM. Happy Festivities from PG-Setu!'
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-medium text-gray-700"
                  >
                    🎉 Festival Dinner
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBroadcastMessage(
                        'Emergency Power Maintenance: Generator switchover will occur today between 3:00 PM and 3:30 PM for Room {{room}}. Inverters will remain active.'
                      )
                    }
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-medium text-gray-700"
                  >
                    ⚡ Power Maintenance
                  </button>
                </div>
              </div>

              <button
                onClick={handleSendBroadcast}
                disabled={sendingBroadcast || !broadcastMessage.trim()}
                className="w-full py-2.5 bg-[#00A884] hover:bg-[#008f6f] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting Messages via WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Send WhatsApp Broadcast Now</span>
                  </>
                )}
              </button>

              {broadcastStatus && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span>✅ Broadcast sent to <strong>{broadcastStatus.dispatchedCount}</strong> residents!</span>
                  <span className="font-mono text-[10px] text-emerald-700">{broadcastStatus.audience.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Broadcast Preview Bubble */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Recipient WhatsApp Preview
              </h4>

              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-gray-200 shadow-inner">
                <div className="bg-white p-3 rounded-xl rounded-bl-xs shadow-xs text-xs text-gray-900 whitespace-pre-line leading-relaxed">
                  {broadcastMessage
                    .replace(/{{name}}/g, 'Arjun Verma')
                    .replace(/{{room}}/g, '204-B')}
                  <span className="block text-[9px] text-gray-400 text-right mt-1 font-mono">
                    11:30 AM
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 space-y-1">
                <p>• Variables like <code>&#123;&#123;name&#125;&#125;</code> and <code>&#123;&#123;room&#125;&#125;</code> are dynamically personalized for each resident stay.</p>
                <p>• Messages are delivered directly through the verified PG-Setu WhatsApp business number.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MESSAGE LOGS & AUDIT */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900">WhatsApp Dispatch & Interaction Audit Logs</h3>
              <p className="text-xs text-gray-500 mt-0.5">Real-time trail of outbound reminders, bot replies, and delivery receipts.</p>
            </div>

            <button
              onClick={loadLogs}
              disabled={loadingLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-600">No message logs recorded yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Send a test message from the simulator or run a cadence trigger to see live records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] uppercase font-black text-gray-400 bg-gray-50/60">
                    <th className="p-3">Time</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Message Snippet</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                        {log.residents?.full_name || 'Resident'}
                      </td>
                      <td className="p-3 font-mono text-gray-600 whitespace-nowrap">
                        {log.recipient_phone}
                      </td>
                      <td className="p-3 text-gray-700 max-w-md truncate" title={log.message_body}>
                        {log.message_body}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.status === 'delivered' || log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {log.status || 'delivered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: META CLOUD API & WEBHOOK CONFIG */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900">Meta WhatsApp Cloud API Webhook</h3>
            <p className="text-xs text-gray-500">
              Configure this Webhook URL in your Meta Developer Portal (WhatsApp &gt; Configuration &gt; Callback URL).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Callback URL:</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value="https://pgsetu.com/api/whatsapp/webhook"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-mono text-gray-800"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://pgsetu.com/api/whatsapp/webhook')
                      setCopiedWebhook(true)
                      setTimeout(() => setCopiedWebhook(false), 2000)
                    }}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    {copiedWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Verify Token:</label>
                <input
                  type="text"
                  readOnly
                  value="pgsetu_secure_webhook_token_2026"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-mono text-gray-800 mt-1"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestWebhookPing}
                  disabled={pinging}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {pinging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  <span>Test Webhook Challenge Handshake (Ping)</span>
                </button>

                {pingResult && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-800">
                    {pingResult}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900">Environment Variables Setup</h3>
            <p className="text-xs text-gray-500">
              For production live messaging, add the following variables in your <code>.env.local</code>:
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-2xl font-mono text-xs space-y-2 overflow-x-auto">
              <p className="text-gray-400"># Meta WhatsApp Cloud API Credentials</p>
              <p><span className="text-emerald-400">WHATSAPP_API_TOKEN</span>=EAAG...your_token_here</p>
              <p><span className="text-emerald-400">WHATSAPP_PHONE_ID</span>=109283746592837</p>
              <p><span className="text-emerald-400">WHATSAPP_VERIFY_TOKEN</span>=pgsetu_secure_webhook_token_2026</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zero-Config Local Sandbox Ready:
              </p>
              <p className="text-[11px] text-emerald-800">
                When credentials are not provided, PG-Setu automatically operates in Sandbox Simulator mode, safely mocking Meta API responses and persisting all actions to the database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
