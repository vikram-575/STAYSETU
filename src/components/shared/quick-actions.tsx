'use client'

import { useRouter } from 'next/navigation'
import { X, UserPlus, CreditCard, Zap, FileText, DollarSign, MessageSquare, BedDouble, LogOut, PlusCircle } from 'lucide-react'

interface QuickAction {
  label: string
  icon: React.ElementType
  href?: string
  color: string
}

const actions: QuickAction[] = [
  { label: 'New Resident', icon: UserPlus, href: '/dashboard/residents/new', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
  { label: 'Add Payment', icon: CreditCard, href: '/dashboard/payments/new', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
  { label: 'Add Charge', icon: PlusCircle, href: '/dashboard/billing/add-charge', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
  { label: 'Electricity Reading', icon: Zap, href: '/dashboard/electricity/reading', color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
  { label: 'Create Invoice', icon: FileText, href: '/dashboard/billing/new', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
  { label: 'Add Expense', icon: DollarSign, href: '/dashboard/expenses/new', color: 'text-red-600 bg-red-50 hover:bg-red-100' },
  { label: 'Send Reminder', icon: MessageSquare, href: '/dashboard/communications/send', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
  { label: 'Add Room/Bed', icon: BedDouble, href: '/dashboard/rooms/new', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
  { label: 'Check Out', icon: LogOut, href: '/dashboard/residents?action=checkout', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' },
]

interface Props {
  onClose: () => void
}

export default function QuickActions({ onClose }: Props) {
  const router = useRouter()

  const handleAction = (action: QuickAction) => {
    if (action.href) {
      router.push(action.href)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-colors ${action.color}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
