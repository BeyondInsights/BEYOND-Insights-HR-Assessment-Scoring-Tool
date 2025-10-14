const generateInvoicePDF = async (data: any) => {
  const { jsPDF } = window.jspdf

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Add logos at the top
  try {
    // Load both logos
    const bestCompaniesLogo = await loadImage('/best-companies-2026-logo.png')
    const cacLogo = await loadImage('/cancer-careers-logo.png')
    
    // Add CAC logo (top left corner)
    doc.addImage(cacLogo, 'PNG', 20, yPos, 35, 12)
    
    // Add Best Companies logo (center top)
    const logoWidth = 30
    const centerX = (pageWidth - logoWidth) / 2
    doc.addImage(bestCompaniesLogo, 'PNG', centerX, yPos, logoWidth, 30)
  } catch (error) {
    console.error('Error loading logos:', error)
    // Fallback text if logos fail
    doc.setFontSize(10)
    doc.setTextColor(255, 107, 53)
    doc.text('CANCER + CAREERS', 20, yPos)
    doc.text('BEST COMPANIES', pageWidth / 2, yPos + 5, { align: 'center' })
  }

  // Invoice header (right side)
  doc.setFontSize(28)
  doc.setTextColor(255, 107, 53)
  doc.text('INVOICE', pageWidth - 20, yPos + 5, { align: 'right' })
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  yPos += 15
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Invoice Date: ${data.invoiceDate}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Due Date: ${data.dueDate}`, pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text('Payment Terms: Net 14', pageWidth - 20, yPos, { align: 'right' })

  // Line separator
  yPos = 60
  doc.setDrawColor(255, 107, 53)
  doc.setLineWidth(1)
  doc.line(20, yPos, pageWidth - 20, yPos)

  // From and Bill To sections
  yPos += 10
  
  // From section (left)
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('From', 20, yPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  yPos += 6
  doc.text('Cancer and Careers', 20, yPos)
  yPos += 5
  doc.text('75 Maiden Lane, Suite 501', 20, yPos)
  yPos += 5
  doc.text('New York, NY 10038', 20, yPos)
  yPos += 5
  doc.text('United States', 20, yPos)
  yPos += 5
  doc.text('Email: info@cancerandcareers.org', 20, yPos)

  // Bill To section (right)
  let rightYPos = 70
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Bill To', pageWidth / 2 + 10, rightYPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  rightYPos += 6
  doc.text(data.companyName, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(data.contactName, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(data.title, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(data.addressLine1, pageWidth / 2 + 10, rightYPos)
  if (data.addressLine2) {
    rightYPos += 5
    doc.text(data.addressLine2, pageWidth / 2 + 10, rightYPos)
  }
  rightYPos += 5
  doc.text(`${data.city}, ${data.state} ${data.zipCode}`, pageWidth / 2 + 10, rightYPos)
  rightYPos += 5
  doc.text(data.country, pageWidth / 2 + 10, rightYPos)
  
  // Application ID
  if (data.applicationId) {
    rightYPos += 5
    doc.setFont(undefined, 'bold')
    doc.text(`Application ID: ${data.applicationId}`, pageWidth / 2 + 10, rightYPos)
    doc.setFont(undefined, 'normal')
  }
  
  if (data.poNumber) {
    rightYPos += 5
    doc.setFont(undefined, 'bold')
    doc.text(`PO #: ${data.poNumber}`, pageWidth / 2 + 10, rightYPos)
    doc.setFont(undefined, 'normal')
  }

  // Table header
  yPos = Math.max(yPos, rightYPos) + 15
  doc.setFillColor(51, 51, 51)
  doc.rect(20, yPos, pageWidth - 40, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.text('Description', 25, yPos + 7)
  doc.text('Amount', pageWidth - 25, yPos + 7, { align: 'right' })

  // Table content
  yPos += 15
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'bold')
  doc.text('Application / Certification Fee', 25, yPos)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  yPos += 5
  doc.text('Best Companies for Working with Cancer Index - Standard Certification', 25, yPos)
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('$1,200.00', pageWidth - 25, yPos - 5, { align: 'right' })

  // Total row
  yPos += 10
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 8
  doc.setFillColor(245, 245, 245)
  doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F')
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL DUE:', pageWidth / 2, yPos + 2, { align: 'right' })
  doc.text('$1,200.00', pageWidth - 25, yPos + 2, { align: 'right' })

  // Payment Terms box - EXPANDED
  yPos += 20
  doc.setDrawColor(255, 107, 53)
  doc.setLineWidth(0.5)
  doc.rect(20, yPos, pageWidth - 40, 75)
  
  doc.setFontSize(11)
  doc.setTextColor(255, 107, 53)
  doc.setFont(undefined, 'bold')
  yPos += 7
  doc.text('Payment Terms & Instructions', 25, yPos)
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'bold')
  yPos += 7
  doc.text('Payment is due within 14 days of invoice date.', 25, yPos)
  
  doc.setFont(undefined, 'normal')
  yPos += 7
  doc.text('Payment Methods:', 25, yPos)
  doc.setFontSize(9)
  yPos += 5
  doc.text('• Check payable to: Cancer and Careers', 30, yPos)
  
  // ACH Transfer Details
  yPos += 6
  doc.setFont(undefined, 'bold')
  doc.text('• For ACH Transfer (Bank Transfer):', 30, yPos)
  doc.setFont(undefined, 'normal')
  yPos += 4
  doc.text('Bank Name: Bank of America', 35, yPos)
  yPos += 4
  doc.text('Bank Account Name: Checking', 35, yPos)
  yPos += 4
  doc.text('Bank Account Number: 4460 5614 6022', 35, yPos)
  yPos += 4
  doc.text('Bank Routing Number: 052001633', 35, yPos)
  yPos += 4
  doc.text(`Reference/Invoice Number: ${data.invoiceNumber}`, 35, yPos)
  yPos += 5
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Please initiate the ACH transfer to the bank details provided above.', 35, yPos)
  yPos += 4
  doc.text('Kindly ensure that the reference/invoice number is included in the transfer description.', 35, yPos)

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 20
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 5
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Thank you for your commitment to supporting employees with cancer!', pageWidth / 2, yPos, { align: 'center' })
  yPos += 4
  doc.text('Cancer and Careers | www.cancerandcareers.org | info@cancerandcareers.org', pageWidth / 2, yPos, { align: 'center' })

  // Save the PDF
  doc.save(`Invoice-${data.invoiceNumber}.pdf`)
}
