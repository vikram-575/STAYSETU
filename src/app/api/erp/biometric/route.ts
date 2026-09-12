import { NextResponse, type NextRequest } from 'next/server'

interface BiometricPunch {
  id: string
  residentName: string
  roomNumber: string
  timestamp: string
  direction: 'IN' | 'OUT'
  deviceName: string
  isCurfewViolation: boolean
  parentAlertSent: boolean
}

interface BiometricDevice {
  id: string
  name: string
  ipAddress: string
  protocol: 'eSSL_Cloud' | 'Realtime_HTTP' | 'Hikvision_ISAPI'
  location: string
  status: 'online' | 'syncing' | 'offline'
  lastSync: string
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_biometric_punches__: BiometricPunch[] | undefined
  // eslint-disable-next-line no-var
  var __pgsetu_biometric_devices__: BiometricDevice[] | undefined
}

if (!global.__pgsetu_biometric_devices__) {
  global.__pgsetu_biometric_devices__ = [
    {
      id: 'dev_01',
      name: 'Main Entrance Turnstile (Gate A)',
      ipAddress: '192.168.1.120',
      protocol: 'eSSL_Cloud',
      location: 'Ground Floor Main Lobby',
      status: 'online',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'dev_02',
      name: 'Girls Wing Face Scanner (Wing B)',
      ipAddress: '192.168.1.121',
      protocol: 'Realtime_HTTP',
      location: '1st Floor Access Door',
      status: 'online',
      lastSync: new Date().toISOString(),
    },
  ]
}

if (!global.__pgsetu_biometric_punches__) {
  global.__pgsetu_biometric_punches__ = [
    {
      id: 'punch_01',
      residentName: 'Arjun Verma',
      roomNumber: '204-B',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      direction: 'IN',
      deviceName: 'Main Entrance Turnstile (Gate A)',
      isCurfewViolation: false,
      parentAlertSent: false,
    },
    {
      id: 'punch_02',
      residentName: 'Kunal Singhania',
      roomNumber: '108',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      direction: 'IN',
      deviceName: 'Main Entrance Turnstile (Gate A)',
      isCurfewViolation: true, // Past 10:00 PM curfew
      parentAlertSent: true,
    },
    {
      id: 'punch_03',
      residentName: 'Pooja Hegde',
      roomNumber: '305',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      direction: 'OUT',
      deviceName: 'Girls Wing Face Scanner (Wing B)',
      isCurfewViolation: false,
      parentAlertSent: false,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const devices = global.__pgsetu_biometric_devices__ || []
    const punches = global.__pgsetu_biometric_punches__ || []

    const curfewViolations = punches.filter((p) => p.isCurfewViolation)

    return NextResponse.json({
      success: true,
      devices,
      punches,
      summary: {
        totalDevices: devices.length,
        onlineDevices: devices.filter((d) => d.status === 'online').length,
        curfewViolationsCount: curfewViolations.length,
        totalPunchesToday: punches.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Biometric query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'punch', residentName, roomNumber, direction = 'IN', isLate = false } = body
    const punches = global.__pgsetu_biometric_punches__ || []

    const newPunch: BiometricPunch = {
      id: `punch_${Date.now()}`,
      residentName: residentName || 'Resident Student',
      roomNumber: roomNumber || '201',
      timestamp: new Date().toISOString(),
      direction: direction as 'IN' | 'OUT',
      deviceName: 'Main Entrance Turnstile (Gate A)',
      isCurfewViolation: isLate,
      parentAlertSent: isLate,
    }

    punches.unshift(newPunch)
    return NextResponse.json({ success: true, punch: newPunch })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to register biometric event' }, { status: 500 })
  }
}
