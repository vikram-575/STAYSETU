import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const CHECKIN_URL = `${BASE_URL}/dashboard/residents/new`

const generateTestResident = () => {
  const uniqueId = Math.floor(100000 + Math.random() * 900000)
  return {
    fullName: `Test Tenant ${uniqueId}`,
    phone: `9876${uniqueId}`,
    email: `tenant_${uniqueId}@example.com`,
    dob: '1998-05-15',
    gender: 'male',
    address: '42 MG Road, Sector 14',
    city: 'Gurugram',
    state: 'Haryana',
    emergencyName: 'Ramesh Sharma',
    emergencyPhone: '9123456780',
    emergencyRelation: 'Parent',
    idType: 'aadhaar',
    idNumber: '123456789012',
    rentRupees: '8500',
    depositRupees: '17000',
  }
}

let createdResidentIds: string[] = []

test.describe('E2E Resident Onboarding & Check-In Wizard', () => {

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-owner-session-token',
        domain: 'localhost',
        path: '/',
      },
    ])
  })

  test.afterEach(async ({ request }) => {
    for (const residentId of createdResidentIds) {
      await request.delete(`${BASE_URL}/api/residents/${residentId}`, {
        headers: { 'Authorization': 'Bearer mock-owner-session-token' }
      }).catch(() => {})
    }
    createdResidentIds = []
  })

  test('Happy Path: Complete 5-Step Resident Onboarding Journey', async ({ page }) => {
    const resident = generateTestResident()

    await page.goto(CHECKIN_URL)
    await expect(page).toHaveTitle(/PG-SETU|Check-in/i)
    await expect(page.getByRole('heading', { name: /Check-in New Resident/i })).toBeVisible()

    // Step 1: Personal Details
    await expect(page.getByText('Step 1 of 5: Personal Details')).toBeVisible()
    await page.fill('input[placeholder*="Full Name"], input[name="full_name"]', resident.fullName)
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', resident.phone)
    await page.fill('input[type="email"], input[name="email"]', resident.email)
    await page.fill('input[type="date"], input[name="date_of_birth"]', resident.dob)
    await page.selectOption('select[name="gender"]', resident.gender)
    await page.click('button:has-text("Next: Address & Emergency")')

    // Step 2: Address & Emergency Contact
    await expect(page.getByText('Step 2 of 5: Address & Emergency')).toBeVisible()
    await page.fill('textarea[name="permanent_address"]', resident.address)
    await page.fill('input[name="permanent_city"]', resident.city)
    await page.fill('input[name="permanent_state"]', resident.state)
    await page.fill('input[name="emergency_name"]', resident.emergencyName)
    await page.fill('input[name="emergency_phone"]', resident.emergencyPhone)
    await page.selectOption('select[name="emergency_relation"]', resident.emergencyRelation)
    await page.click('button:has-text("Next: ID Proof")')

    // Step 3: ID Proof
    await expect(page.getByText('Step 3 of 5: ID Proof & Documents')).toBeVisible()
    await page.selectOption('select[name="id_type"]', resident.idType)
    await page.fill('input[name="id_number"]', resident.idNumber)
    await page.click('button:has-text("Next: Room & Bed")')

    // Step 4: Room & Bed
    await expect(page.getByText('Step 4 of 5: Room & Bed Assignment')).toBeVisible()
    const propertySelect = page.locator('select[name="property_id"]')
    await expect(propertySelect).toBeVisible()
    await propertySelect.selectOption({ index: 0 })

    const bedSelect = page.locator('select[name="bed_id"]')
    await expect(bedSelect).toBeEnabled()
    await bedSelect.selectOption({ index: 0 })

    await page.fill('input[name="monthly_rent_rupees"]', resident.rentRupees)
    await page.click('button:has-text("Next: Security Deposit")')

    // Step 5: Security Deposit
    await expect(page.getByText('Step 5 of 5: Security Deposit')).toBeVisible()
    await page.fill('input[name="deposit_amount_rupees"]', resident.depositRupees)
    await page.selectOption('select[name="deposit_payment_method"]', 'upi')

    const responsePromise = page.waitForResponse((res) =>
      res.url().includes('/api/residents/checkin') && res.status() === 200
    )

    await page.click('button:has-text("Complete Check-In")')

    const response = await responsePromise
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.registration_number).toMatch(/^REG-\d{4}-\d+/)

    if (json.resident_id) createdResidentIds.push(json.resident_id)

    await expect(page.getByText(/Check-in Completed Successfully/i)).toBeVisible()
    await expect(page.getByText(json.registration_number)).toBeVisible()
    await expect(page.getByText(resident.fullName)).toBeVisible()

    const viewProfileBtn = page.getByRole('link', { name: /View Resident Profile/i })
    await expect(viewProfileBtn).toBeVisible()
    await expect(viewProfileBtn).toHaveAttribute('href', `/dashboard/residents/${json.resident_id}`)
  })

  test('Failure Path 1: Invalid Phone Blocks Progression to Step 2', async ({ page }) => {
    await page.goto(CHECKIN_URL)

    await page.fill('input[name="full_name"]', 'Invalid Phone User')
    await page.fill('input[name="phone"]', '1234')
    await page.click('button:has-text("Next: Address & Emergency")')

    await expect(page.getByText(/Please enter a valid 10-digit phone number/i)).toBeVisible()
    await expect(page.getByText('Step 1 of 5: Personal Details')).toBeVisible()
    await expect(page.getByText('Step 2 of 5')).not.toBeVisible()
  })

  test('Failure Path 2: Server 500 Error Displays Alert and Retains User Data', async ({ page }) => {
    const resident = generateTestResident()
    await page.goto(CHECKIN_URL)

    await page.route('**/api/residents/checkin', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database transaction lock timeout. Please retry.' }),
      })
    })

    await page.fill('input[name="full_name"]', resident.fullName)
    await page.fill('input[name="phone"]', resident.phone)
    await page.click('button:has-text("Next: Address & Emergency")')

    await page.fill('textarea[name="permanent_address"]', resident.address)
    await page.click('button:has-text("Next: ID Proof")')

    await page.fill('input[name="id_number"]', resident.idNumber)
    await page.click('button:has-text("Next: Room & Bed")')

    await page.click('button:has-text("Next: Security Deposit")')
    await page.click('button:has-text("Complete Check-In")')

    const errorAlert = page.locator('.bg-rose-50, .border-red-200, [role="alert"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText(/Database transaction lock timeout/i)

    const submitBtn = page.getByRole('button', { name: /Complete Check-In/i })
    await expect(submitBtn).toBeEnabled()
  })

  test('Performance/Network Throttling: Handles Slow 3G with Loading Spinners & Disabled State', async ({
    page,
    context,
  }) => {
    const resident = generateTestResident()
    await page.goto(CHECKIN_URL)

    await page.fill('input[name="full_name"]', resident.fullName)
    await page.fill('input[name="phone"]', resident.phone)
    await page.click('button:has-text("Next: Address & Emergency")')
    await page.click('button:has-text("Next: ID Proof")')
    await page.click('button:has-text("Next: Room & Bed")')
    await page.click('button:has-text("Next: Security Deposit")')

    const cdpSession = await context.newCDPSession(page)
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: ((400 * 1024) / 8),
      uploadThroughput: ((400 * 1024) / 8),
    })

    await page.route('**/api/residents/checkin', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          registration_number: 'REG-2026-SLOW-01',
          resident_id: 'mock-slow-id',
        }),
      })
    })

    const submitBtn = page.getByRole('button', { name: /Complete Check-In/i })
    await submitBtn.click()

    await expect(submitBtn).toBeDisabled()
    await expect(page.locator('svg.animate-spin')).toBeVisible()
    await expect(page.getByText('REG-2026-SLOW-01')).toBeVisible({ timeout: 10000 })
  })
})
