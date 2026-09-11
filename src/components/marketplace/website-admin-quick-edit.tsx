'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Edit3, ExternalLink, Settings, Sparkles, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react'

interface SectionEditButtonProps {
  section: string
  label?: string
  className?: string
}

export function SectionEditButton(_props: SectionEditButtonProps) {
  // Public website visitors should never see edit buttons; editing is restricted to Admin Panel only
  return null
}

export function FloatingWebsiteAdminBar() {
  // Public website visitors should never see floating editor toolbar; editing is restricted to Admin Panel only
  return null
}
