import { jsPDF } from 'jspdf'
import type { EgresadosSchool, PriceEntry, PaymentInfo } from '@/types/eventosConfig.types'
import { formatPrice } from '@/types/eventosConfig.types'

// Backward compat: normalize prices from old or new format
function normalizePricesForPdf(raw: unknown): PriceEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as PriceEntry[]
  // Old format: { adult, minor, after_dinner }
  if (typeof raw === 'object' && raw !== null && 'adult' in raw) {
    const obj = raw as Record<string, number | null>
    const entries: PriceEntry[] = []
    if (obj.adult !== null && obj.adult !== undefined) entries.push({ label: 'Adulto', amount: obj.adult })
    if (obj.minor !== null && obj.minor !== undefined) entries.push({ label: 'Menor', amount: obj.minor })
    if (obj.after_dinner !== null && obj.after_dinner !== undefined) entries.push({ label: 'After Dinner', amount: obj.after_dinner })
    return entries
  }
  return []
}

// Backward compat: normalize payment_info from old or new format
function normalizePaymentInfosForPdf(raw: unknown): PaymentInfo[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as PaymentInfo[]
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return [raw as PaymentInfo]
  }
  return []
}

export function generateSchoolPdf(school: EgresadosSchool, extraText?: string): void {
  const doc = new jsPDF()
  let y = 20

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Eventos Viajes', 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Egresados ${school.year}`, 105, y, { align: 'center' })
  y += 15

  // Separator
  doc.setDrawColor(200)
  doc.line(20, y, 190, y)
  y += 10

  // School name
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(school.school_name, 20, y)
  y += 12

  // Event date and venue
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  if (school.event_date) {
    doc.text(`Fecha del evento: ${school.event_date}`, 20, y)
    y += 7
  }
  if (school.venue_name) {
    doc.text(`Salon: ${school.venue_name}`, 20, y)
    y += 7
  }
  y += 5

  // Prices
  const prices = normalizePricesForPdf(school.prices)
  if (prices.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Precios', 20, y)
    y += 8

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    for (const entry of prices) {
      doc.text(`${entry.label}:`, 25, y)
      doc.text(formatPrice(entry.amount), 80, y)
      y += 7
    }
    y += 5
  }

  // Payment info
  const paymentInfos = normalizePaymentInfosForPdf(school.payment_info)
  if (paymentInfos.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Informacion de Pago', 20, y)
    y += 8

    for (let i = 0; i < paymentInfos.length; i++) {
      const pi = paymentInfos[i]

      // Add sub-header if multiple payment blocks
      if (paymentInfos.length > 1) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Metodo de pago ${i + 1}`, 25, y)
        y += 7
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')

      const fields = [
        ['Direccion efectivo', pi.cash_address],
        ['Banco', pi.bank_name],
        ['CBU', pi.cbu],
        ['Alias', pi.alias],
        ['CUIT', pi.cuit],
        ['Email', pi.email]
      ]

      for (const [label, value] of fields) {
        if (value) {
          doc.text(`${label}:`, 25, y)
          doc.text(value, 80, y)
          y += 7
        }
      }
      y += 3
    }
    y += 2
  }

  // Enrollment link
  if (school.enrollment_link) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Link de Inscripcion', 20, y)
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 200)
    doc.text(school.enrollment_link, 25, y)
    doc.setTextColor(0, 0, 0)
    y += 10
  }

  // Extra text
  if (extraText?.trim()) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Informacion Adicional', 20, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(extraText, 165)
    doc.text(lines, 25, y)
    y += lines.length * 6 + 5
  }

  // Footer
  doc.setDrawColor(200)
  doc.line(20, 275, 190, 275)
  doc.setFontSize(9)
  doc.setTextColor(128)
  doc.text('Eventos Viajes - San Juan, Argentina', 105, 282, { align: 'center' })

  // Download
  const filename = `${school.school_name.replace(/\s+/g, '_')}_${school.year}.pdf`
  doc.save(filename)
}
