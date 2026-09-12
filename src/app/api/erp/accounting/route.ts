import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

interface JournalEntry {
  id: string
  date: string
  voucherNumber: string
  voucherType: 'RENT_INVOICE' | 'PAYMENT_RECEIPT' | 'VENDOR_EXPENSE' | 'DEPOSIT_REFUND'
  narration: string
  debitAccount: string
  creditAccount: string
  amountPaise: number
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_accounting_journals__: JournalEntry[] | undefined
}

if (!global.__pgsetu_accounting_journals__) {
  global.__pgsetu_accounting_journals__ = [
    {
      id: 'je_01',
      date: new Date().toISOString().split('T')[0],
      voucherNumber: 'JV-2025-001',
      voucherType: 'RENT_INVOICE',
      narration: 'Monthly rent charge posted for Room 204 (Arjun Verma)',
      debitAccount: 'Accounts Receivable (Tenant Rent)',
      creditAccount: 'Rental Revenue Account',
      amountPaise: 1200000,
    },
    {
      id: 'je_02',
      date: new Date().toISOString().split('T')[0],
      voucherNumber: 'JV-2025-002',
      voucherType: 'PAYMENT_RECEIPT',
      narration: 'Rent receipt via ICICI Bank Virtual Account (Arjun Verma)',
      debitAccount: 'ICICI Bank CMS Account',
      creditAccount: 'Accounts Receivable (Tenant Rent)',
      amountPaise: 1200000,
    },
    {
      id: 'je_03',
      date: new Date().toISOString().split('T')[0],
      voucherNumber: 'JV-2025-003',
      voucherType: 'VENDOR_EXPENSE',
      narration: 'Kitchen groceries procurement (Nandini Milk & Vegetables)',
      debitAccount: 'Food & Mess Procurement Expense',
      creditAccount: 'Cash in Hand / Cashier Vault',
      amountPaise: 450000,
    },
    {
      id: 'je_04',
      date: new Date().toISOString().split('T')[0],
      voucherNumber: 'JV-2025-004',
      voucherType: 'VENDOR_EXPENSE',
      narration: 'High-speed broadband internet lease line (ACT Fibernet)',
      debitAccount: 'Internet & Utilities Expense',
      creditAccount: 'ICICI Bank CMS Account',
      amountPaise: 350000,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get('export') // 'tally' | 'zoho'

    const journals = global.__pgsetu_accounting_journals__ || []

    // Calculate trial balance
    const accounts: Record<string, { debitPaise: number; creditPaise: number }> = {}
    journals.forEach((j) => {
      if (!accounts[j.debitAccount]) accounts[j.debitAccount] = { debitPaise: 0, creditPaise: 0 }
      if (!accounts[j.creditAccount]) accounts[j.creditAccount] = { debitPaise: 0, creditPaise: 0 }
      accounts[j.debitAccount].debitPaise += j.amountPaise
      accounts[j.creditAccount].creditPaise += j.amountPaise
    })

    const trialBalance = Object.entries(accounts).map(([accountName, balances]) => ({
      accountName,
      debitPaise: balances.debitPaise,
      creditPaise: balances.creditPaise,
      netPaise: balances.debitPaise - balances.creditPaise,
    }))

    const totalDebitPaise = trialBalance.reduce((sum, a) => sum + a.debitPaise, 0)
    const totalCreditPaise = trialBalance.reduce((sum, a) => sum + a.creditPaise, 0)
    const isBalanced = totalDebitPaise === totalCreditPaise

    // Handle Tally XML Export
    if (exportFormat === 'tally') {
      const tallyXml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        ${journals
          .map(
            (j) => `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Journal" ACTION="Create">
            <DATE>${j.date.replace(/-/g, '')}</DATE>
            <VOUCHERNUMBER>${j.voucherNumber}</VOUCHERNUMBER>
            <NARRATION>${j.narration}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${j.debitAccount}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${(j.amountPaise / 100).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${j.creditAccount}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${(j.amountPaise / 100).toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`
          )
          .join('')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`

      return new NextResponse(tallyXml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="PG-Setu-Tally-Vouchers.xml"',
        },
      })
    }

    // Handle Zoho Books CSV Export
    if (exportFormat === 'zoho') {
      const headers = 'Date,Voucher Number,Debit Account,Credit Account,Amount,Notes\n'
      const rows = journals
        .map(
          (j) =>
            `"${j.date}","${j.voucherNumber}","${j.debitAccount}","${j.creditAccount}","${(
              j.amountPaise / 100
            ).toFixed(2)}","${j.narration.replace(/"/g, '""')}"`
        )
        .join('\n')

      return new NextResponse(headers + rows, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="PG-Setu-ZohoBooks-Journals.csv"',
        },
      })
    }

    return NextResponse.json({
      success: true,
      journals,
      trialBalance,
      summary: {
        totalDebitPaise,
        totalCreditPaise,
        isBalanced,
        voucherCount: journals.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Accounting query failed' }, { status: 500 })
  }
}
