/**
 * Generate Invoice PDF - Exact format matching user-facing invoice
 * Used in both user payment flow and admin view
 */

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  companyName: string
  contactName: string
  title?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  poNumber?: string
  isFoundingPartner?: boolean
}

export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<string> {
  // Load jsPDF if not already loaded
  if (!(window as any).jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
  }

  const { jsPDF } = (window as any).jspdf
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Try to add the Cancer + Careers logo
  try {
    const cacImg = new Image()
    cacImg.crossOrigin = 'anonymous'
    cacImg.src = '/cancer-careers-logo.png'
    
    await new Promise((resolve, reject) => {
      cacImg.onload = resolve
      cacImg.onerror = reject
      setTimeout(reject, 500)
    })
    
    if (cacImg.complete && cacImg.naturalWidth > 0) {
      doc.addImage(cacImg, 'PNG', 20, yPos, 45, 16, undefined, 'FAST')
    }
  } catch (logoError) {
    doc.setFontSize(14)
    doc.setTextColor(255, 107, 53)
    doc.setFont(undefined, 'bold')
    doc.text('CANCER + CAREERS', 20, yPos + 10)
  }

  // Invoice header
  doc.setFontSize(28)
  doc.setTextColor(255, 107, 53)
  doc.text('INVOICE', pageWidth - 20, yPos + 5, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  yPos += 15
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Invoice Date: ${invoiceData.invoiceDate}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Due Date: ${invoiceData.dueDate}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text('Payment Terms: Net 30', pageWidth - 20, yPos, { align: 'right' })

  // Line separator
  yPos = 60
  doc.setDrawColor(255, 107, 53)
  doc.setLineWidth(1)
  doc.line(20, yPos, pageWidth - 20, yPos)

  // From section
  yPos += 10
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('From', 20, yPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  yPos += 6
  doc.text('Cancer and Careers', 20, yPos)
  yPos += 5
  doc.text('250 W. 57th Street, Suite 918', 20, yPos)
  yPos += 5
  doc.text('New York, NY 10107', 20, yPos)
  yPos += 5
  doc.text('United States', 20, yPos)
  yPos += 5
  doc.text('Email: cacbestcompanies@cew.org', 20, yPos)

  // Bill To section
  let rightYPos = 70
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Bill To', pageWidth / 2 + 10, rightYPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  rightYPos += 6
  doc.text(invoiceData.companyName, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(invoiceData.contactName, pageWidth / 2 + 10, rightYPos)
  if (invoiceData.title) {
    rightYPos += 5
    doc.text(invoiceData.title, pageWidth / 2 + 10, rightYPos)
  }
  rightYPos += 5
  doc.text(invoiceData.addressLine1, pageWidth / 2 + 10, rightYPos)
  if (invoiceData.addressLine2) {
    rightYPos += 5
    doc.text(invoiceData.addressLine2, pageWidth / 2 + 10, rightYPos)
  }
  rightYPos += 5
  doc.text(`${invoiceData.city}, ${invoiceData.state} ${invoiceData.zipCode}`, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(invoiceData.country, pageWidth / 2 + 10, rightYPos)
  if (invoiceData.poNumber) {
    rightYPos += 5
    doc.setFont(undefined, 'bold')
    doc.text(`PO #: ${invoiceData.poNumber}`, pageWidth / 2 + 10, rightYPos)
    doc.setFont(undefined, 'normal')
  }

  // Table
  yPos = Math.max(yPos, rightYPos) + 15
  doc.setFillColor(51, 51, 51)
  doc.rect(20, yPos, pageWidth - 40, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.text('Description', 25, yPos + 7)
  doc.text('Amount', pageWidth - 25, yPos + 7, { align: 'right' })

  yPos += 15
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'bold')
  doc.text('Survey Fee', 25, yPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  yPos += 5
  doc.text('Best Companies for Working with Cancer Initiative', 25, yPos)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  const amount = invoiceData.isFoundingPartner ? '$0.00' : '$1,250.00'
  doc.text(amount, pageWidth - 25, yPos - 5, { align: 'right' })

  // Total line
  yPos += 10
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)

  // Total
  yPos += 10
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('TOTAL DUE:', pageWidth / 2 - 10, yPos, { align: 'right' })
  doc.text(amount, pageWidth - 25, yPos, { align: 'right' })

  // Payment instructions box
  if (!invoiceData.isFoundingPartner) {
    yPos += 15
    doc.setDrawColor(255, 107, 53)
    doc.setLineWidth(0.5)
    doc.rect(20, yPos, pageWidth - 40, 85)
    
    yPos += 7
    doc.setFontSize(11)
    doc.setTextColor(255, 107, 53)
    doc.text('Payment Terms & Instructions', 25, yPos)
    
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'bold')
    yPos += 7
    doc.text('Payment is due within 30 days of invoice date.', 25, yPos)
    
    doc.setFont(undefined, 'normal')
    yPos += 6
    doc.text('Payment Methods:', 25, yPos)
    
    yPos += 5
    doc.text('• Check payable to: Cosmetic Executive Women Foundation, LTD', 27, yPos)
    yPos += 4
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('   Mail to: 250 W. 57th Street, Suite 918, New York, NY 10107', 27, yPos)
    
    yPos += 6
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text('• ACH Transfer (Domestic US Bank Transfer):', 27, yPos)
    yPos += 4
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('   Account Name: Cosmetic Executive Women Foundation, LTD', 27, yPos)
    yPos += 3.5
    doc.text('   Bank: Bank of America', 27, yPos)
    yPos += 3.5
    doc.text('   ACH Routing Number: 021000322', 27, yPos)
    yPos += 3.5
    doc.text('   Account Number: 483043533766', 27, yPos)
    yPos += 3.5
    doc.text(`   Reference: ${invoiceData.invoiceNumber}`, 27, yPos)
    
    yPos += 6
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text('• Wire Transfer (Domestic & International):', 27, yPos)
    yPos += 4
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('   Account Number: 483043533766', 27, yPos)
    yPos += 3.5
    doc.text('   Wire Routing Number: 026009593', 27, yPos)
    yPos += 3.5
    doc.text('   SWIFT Code: BOFAUS3N', 27, yPos)
    yPos += 3.5
    doc.text('   Bank Address: One Bryant Park, 36th Floor, New York, NY 10036', 27, yPos)
    yPos += 3.5
    doc.text(`   Reference: ${invoiceData.invoiceNumber}`, 27, yPos)
    
    yPos += 7
    doc.setFontSize(8)
    doc.text('Please include the invoice number in your payment reference. Questions: cacbestcompanies@cew.org', 25, yPos)
  }

  // Footer
  yPos = 280
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 5
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Thank you for your commitment to supporting employees with cancer!', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text('Cancer and Careers | www.cancerandcareers.org | cacbestcompanies@cew.org', pageWidth / 2, yPos, { align: 'center' })

  // Return base64 string
  return doc.output('datauristring', { compress: true }).split(',')[1]
}

export async function downloadInvoicePDF(invoiceData: InvoiceData) {
  const base64 = await generateInvoicePDF(invoiceData)
  
  // Convert base64 to blob
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  
  // Download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CAC-Invoice-${invoiceData.invoiceNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
