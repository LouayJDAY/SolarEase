import React, { useState } from 'react'

type InvoiceResponse = {
  invoiceNumber?: string
  date?: string
  totalTTC?: number
  supplierName?: string
  confidences?: Record<string, number>
}

export default function InvoiceUploadModal({ onClose, onApply } : { onClose: ()=>void, onApply: (data: InvoiceResponse)=>void }){
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<InvoiceResponse | null>(null)
  const [editable, setEditable] = useState<InvoiceResponse | null>(null)
  const [loading, setLoading] = useState(false)

  function onChange(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
  }

  async function upload(){
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try{
      const res = await fetch('/api/dimensioning/invoices/parse', { method: 'POST', body: fd })
      if (res.ok){
        const json: InvoiceResponse = await res.json()
        setResult(json)
        setEditable({
          invoiceNumber: json.invoiceNumber,
          date: json.date,
          totalTTC: json.totalTTC,
          supplierName: json.supplierName,
          confidences: json.confidences,
        })
      } else {
        alert('Erreur lors du parsing')
      }
    }catch(e){
      alert('Erreur réseau')
    } finally { setLoading(false) }
  }

  function confidenceLabel(key: keyof InvoiceResponse) {
    const score = result?.confidences?.[String(key)]
    if (score == null) return 'N/A'
    return `${Math.round(score * 100)}%`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-secondary">Téléverser une facture</h3>
        <p className="text-sm text-gray-600 mt-1">L'IA extrait les champs, puis vous pouvez corriger avant validation.</p>

        <input className="mt-4" type="file" accept="image/*" onChange={onChange} />
        {preview && (
          <img src={preview} className="max-w-xs mt-3 rounded-lg border border-gray-200" alt="preview" />
        )}
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50" onClick={upload} disabled={loading || !file}>
            {loading ? 'Analyse...' : 'Analyser'}
          </button>
          <button className="px-4 py-2 bg-gray-100 text-secondary rounded-lg" onClick={onClose}>Fermer</button>
        </div>

        {editable && (
          <div className="mt-5 border-t border-gray-200 pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro facture <span className="text-xs text-gray-500">({confidenceLabel('invoiceNumber')})</span></label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editable.invoiceNumber || ''}
                onChange={(e) => setEditable({ ...editable, invoiceNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date <span className="text-xs text-gray-500">({confidenceLabel('date')})</span></label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editable.date || ''}
                onChange={(e) => setEditable({ ...editable, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total TTC <span className="text-xs text-gray-500">({confidenceLabel('totalTTC')})</span></label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editable.totalTTC ?? ''}
                onChange={(e) => setEditable({ ...editable, totalTTC: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fournisseur <span className="text-xs text-gray-500">({confidenceLabel('supplierName')})</span></label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={editable.supplierName || ''}
                onChange={(e) => setEditable({ ...editable, supplierName: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <button className="px-4 py-2 bg-primary text-white rounded-lg" onClick={() => { onApply(editable); onClose() }}>Appliquer à la simulation</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
