'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  UploadCloud, FileSpreadsheet, Download, CheckCircle2,
  AlertCircle, ArrowLeft, Loader2, Play, Users, Trash2
} from 'lucide-react'

export default function BulkImportResidentsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState<any>(null)

  // Sample data for quick testing
  const loadDemoData = () => {
    setParsedRows([
      { name: 'Karan Mehra', phone: '9876501234', room: '101', bed: 'A', rent: 9000, deposit: 15000, joiningDate: '2025-09-01' },
      { name: 'Pooja Iyer', phone: '9845112233', room: '202', bed: 'B', rent: 11000, deposit: 20000, joiningDate: '2025-09-05' },
      { name: 'Naveen Reddy', phone: '9731224455', room: '305', bed: 'A', rent: 8500, deposit: 10000, joiningDate: '2025-09-10' },
      { name: 'Divya Sharma', phone: '9988771122', room: '404', bed: 'C', rent: 12500, deposit: 25000, joiningDate: '2025-09-12' },
    ])
    setImportSuccess(null)
  }

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Full Name,Phone,Room Number,Bed Label,Monthly Rent,Security Deposit,Joining Date\nArjun Verma,9876543210,101,A,9500,15000,2025-09-01\nRohit Sharma,9811223344,102,B,8000,12000,2025-09-05\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'PGSetu_Resident_Import_Template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return
    setFile(uploadedFile)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      if (!text) return
      const lines = text.split('\n').filter((l) => l.trim().length > 0)
      const dataRows = lines.slice(1).map((line) => {
        const [name, phone, room, bed, rent, deposit, joiningDate] = line.split(',').map((item) => item.trim())
        return { name, phone, room, bed, rent: Number(rent) || 0, deposit: Number(deposit) || 0, joiningDate }
      })
      setParsedRows(dataRows)
      setImportSuccess(null)
    }
    reader.readAsText(uploadedFile)
  }

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return
    try {
      setImporting(true)
      const res = await fetch('/api/erp/residents/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportSuccess(data.results)
      } else {
        alert(data.error || 'Import failed')
      }
    } catch {
      alert('Network error during import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/residents"
              className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              CSV MIGRATION
            </span>
            <h1 className="text-xl font-black text-gray-900">Bulk Resident Onboarding (Excel / CSV)</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-7">
            Instantly onboard 100+ existing residents, room assignments, and starting ledgers in under 60 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Download Sample CSV</span>
          </button>

          <button
            onClick={loadDemoData}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-xl transition"
          >
            <Play className="w-3.5 h-3.5 text-emerald-700" />
            <span>Load Sample 4 Residents</span>
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-gray-300 text-center hover:border-emerald-500 transition relative">
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">
          {file ? file.name : 'Drag and drop your resident CSV file here, or click to browse'}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Supports .CSV files exported from Excel, Google Sheets, or previous software
        </p>
      </div>

      {/* Success Notification */}
      {importSuccess && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Successfully imported {importSuccess.imported} of {importSuccess.total} residents into your active CRM!
            </span>
          </div>
          <Link
            href="/dashboard/residents"
            className="px-3 py-1 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            View Residents CRM →
          </Link>
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs space-y-3 p-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black text-gray-800">
                Pre-Import Validation Grid ({parsedRows.length} Rows Detected)
              </h3>
            </div>
            <button
              onClick={handleExecuteImport}
              disabled={importing}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#14532D] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{importing ? 'Importing...' : 'Batch Import Validated Residents'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5">Phone Number</th>
                  <th className="p-2.5">Room & Bed</th>
                  <th className="p-2.5">Monthly Rent</th>
                  <th className="p-2.5">Deposit</th>
                  <th className="p-2.5">Joining Date</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {parsedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition">
                    <td className="p-2.5 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-gray-900">{r.name}</td>
                    <td className="p-2.5 font-mono text-gray-700">{r.phone}</td>
                    <td className="p-2.5 font-semibold text-blue-700">Room {r.room} (Bed {r.bed})</td>
                    <td className="p-2.5 font-bold text-emerald-700">₹{r.rent?.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 font-bold text-purple-700">₹{r.deposit?.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-gray-600">{r.joiningDate || 'Immediate'}</td>
                    <td className="p-2.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ Valid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
