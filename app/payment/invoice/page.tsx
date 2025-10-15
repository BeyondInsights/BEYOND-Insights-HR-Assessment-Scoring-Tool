'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Building2, MapPin, Download, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function InvoicePaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [companyData, setCompanyData] = useState({
    companyName: '',
    contactName: '',
    title: '',
    applicationId: ''
  })
  const [formData, setFormData] = useState({
    poNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  })

  useEffect(() => {
    try {
      const companyName = localStorage.getItem('login_company_name') || ''
      const firstName = localStorage.getItem('login_first_name') || ''
      const lastName = localStorage.getItem('login_last_name') || ''
      const title = localStorage.getItem('login_title') || ''
      const applicationId = localStorage.getItem('login_application_id') || ''
      
      setCompanyData({
        companyName,
        contactName: `${firstName} ${lastName}`,
        title,
        applicationId
      })

      // Load jsPDF library
      if (!document.querySelector('script[src*="jspdf"]')) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.async = true
        script.onload = () => setScriptLoaded(true)
        script.onerror = () => {
          console.error('Failed to load jsPDF')
          setScriptLoaded(false)
        }
        document.body.appendChild(script)
      } else {
        setScriptLoaded(true)
      }
    } catch (error) {
      console.error('Error in useEffect:', error)
    }
  }, [])

  const handleDownloadInvoice = async () => {
    if (!formData.addressLine1 || !formData.city || !formData.state || !formData.zipCode || !formData.country) {
      alert('Please fill in all required address fields')
      return
    }

    if (!scriptLoaded) {
      alert('PDF library is still loading. Please try again in a moment.')
      return
    }

    setLoading(true)

    try {
      // Save invoice data
      const invoiceData = {
        ...companyData,
        ...formData,
        invoiceNumber: `INV-${Date.now()}`,
        invoiceDate: new Date().toLocaleDateString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        amount: 1200
      }
      localStorage.setItem('invoice_data', JSON.stringify(invoiceData))

      // Generate PDF
      await generateInvoicePDF(invoiceData)
      
      // Grant access to dashboard
      localStorage.setItem('payment_completed', 'invoice')
      
      setLoading(false)
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('There was an error generating the invoice. Please try again.')
      setLoading(false)
    }
  }

  const generateInvoicePDF = async (data: any) => {
    try {
      const { jsPDF } = (window as any).jspdf
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPos = 20

      // Try to add logos, but continue if they fail
      try {
        const cacImg = new Image()
        cacImg.crossOrigin = 'anonymous'
        cacImg.src = '/cancer-careers-logo.png'
        await new Promise((resolve) => {
          cacImg.onload = resolve
          setTimeout(resolve, 1000) // Timeout after 1 second
        })
        if (cacImg.complete) {
          doc.addImage(cacImg, 'PNG', 20, yPos, 50, 18)  // Increased from 35x12 to 50x18
        }

        const bcImg = new Image()
        bcImg.crossOrigin = 'anonymous'
        bcImg.src = '/best-companies-2026-logo.png'
        await new Promise((resolve) => {
          bcImg.onload = resolve
          setTimeout(resolve, 1000)
        })
        if (bcImg.complete) {
          const logoWidth = 30
          const centerX = (pageWidth - logoWidth) / 2
          doc.addImage(bcImg, 'PNG', centerX, yPos, logoWidth, 30)
        }
      } catch (logoError) {
        console.warn('Logos failed to load, continuing without them')
        // Add text fallback
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
      doc.text('$1,250.00', pageWidth - 25, yPos - 5, { align: 'right' })

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
      doc.text('$1,250.00', pageWidth - 25, yPos + 2, { align: 'right' })

      // Payment Terms box
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
      doc.text('Bank Name: ACME BANK ANYWHERE USA', 35, yPos)
      yPos += 4
      doc.text('Bank Account Name: Checking', 35, yPos)
      yPos += 4
      doc.text('Bank Account Number: #### #### ####', 35, yPos)
      yPos += 4
      doc.text('Bank Routing Number: #########', 35, yPos)
      yPos += 4
      doc.text(`Reference/Invoice Number: ${data.invoiceNumber}`, 35, yPos)
      yPos += 5
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Please initiate the ACH transfer to the bank details provided above.', 35, yPos)
      yPos += 4
      doc.text('Kindly ensure that the invoice number is included in the transfer description.', 35, yPos)

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
    } catch (error) {
      console.error('Error in PDF generation:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10 flex-1">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <FileText className="w-10 h-10 text-orange-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Invoice</h1>
              <p className="text-gray-600">Download your certification invoice</p>
            </div>
          </div>

          {/* Company Info (Pre-filled) - COMPACT LAYOUT */}
<div className="bg-gray-50 rounded-lg p-6 mb-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
  <div className="grid grid-cols-2 gap-6">
    <div>
      <p className="text-sm text-gray-500">Company Name</p>
      <p className="font-medium">{companyData.companyName}</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Contact Person</p>
      <p className="font-medium">{companyData.contactName}</p>
      <p className="text-sm text-gray-500 mt-2">Title</p>
      <p className="font-medium">{companyData.title}</p>
    </div>
  </div>
</div>

          {/* Invoice Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleDownloadInvoice(); }}>
            {/* PO Number */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Purchase Order Number (Optional)
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="PO-123456"
              />
            </div>

            {/* Billing Address */}
<div className="mb-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
    <MapPin className="w-5 h-5 mr-2 text-gray-600" />
    Billing Address
  </h3>

  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">
        Address Line 1 <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        required
        value={formData.addressLine1}
        onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        placeholder="123 Main Street"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        Address Line 2 (Optional)
      </label>
      <input
        type="text"
        value={formData.addressLine2}
        onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        placeholder="Suite 100"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.city}
          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="New York"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          State / Province / Region <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.state}
          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="NY"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          ZIP / Postal Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.zipCode}
          onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="10001"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Country <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.country}
          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="Australia">Australia</option>
          <option value="Afghanistan">Afghanistan</option>
          <option value="Albania">Albania</option>
          <option value="Algeria">Algeria</option>
          <option value="Andorra">Andorra</option>
          <option value="Angola">Angola</option>
          <option value="Argentina">Argentina</option>
          <option value="Armenia">Armenia</option>
          <option value="Austria">Austria</option>
          <option value="Azerbaijan">Azerbaijan</option>
          <option value="Bahamas">Bahamas</option>
          <option value="Bahrain">Bahrain</option>
          <option value="Bangladesh">Bangladesh</option>
          <option value="Barbados">Barbados</option>
          <option value="Belarus">Belarus</option>
          <option value="Belgium">Belgium</option>
          <option value="Belize">Belize</option>
          <option value="Benin">Benin</option>
          <option value="Bhutan">Bhutan</option>
          <option value="Bolivia">Bolivia</option>
          <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
          <option value="Botswana">Botswana</option>
          <option value="Brazil">Brazil</option>
          <option value="Brunei">Brunei</option>
          <option value="Bulgaria">Bulgaria</option>
          <option value="Burkina Faso">Burkina Faso</option>
          <option value="Burundi">Burundi</option>
          <option value="Cambodia">Cambodia</option>
          <option value="Cameroon">Cameroon</option>
          <option value="Canada">Canada</option>
          <option value="Cape Verde">Cape Verde</option>
          <option value="Central African Republic">Central African Republic</option>
          <option value="Chad">Chad</option>
          <option value="Chile">Chile</option>
          <option value="China">China</option>
          <option value="Colombia">Colombia</option>
          <option value="Comoros">Comoros</option>
          <option value="Congo">Congo</option>
          <option value="Costa Rica">Costa Rica</option>
          <option value="Croatia">Croatia</option>
          <option value="Cuba">Cuba</option>
          <option value="Cyprus">Cyprus</option>
          <option value="Czech Republic">Czech Republic</option>
          <option value="Denmark">Denmark</option>
          <option value="Djibouti">Djibouti</option>
          <option value="Dominica">Dominica</option>
          <option value="Dominican Republic">Dominican Republic</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Egypt">Egypt</option>
          <option value="El Salvador">El Salvador</option>
          <option value="Equatorial Guinea">Equatorial Guinea</option>
          <option value="Eritrea">Eritrea</option>
          <option value="Estonia">Estonia</option>
          <option value="Ethiopia">Ethiopia</option>
          <option value="Fiji">Fiji</option>
          <option value="Finland">Finland</option>
          <option value="France">France</option>
          <option value="Gabon">Gabon</option>
          <option value="Gambia">Gambia</option>
          <option value="Georgia">Georgia</option>
          <option value="Germany">Germany</option>
          <option value="Ghana">Ghana</option>
          <option value="Greece">Greece</option>
          <option value="Grenada">Grenada</option>
          <option value="Guatemala">Guatemala</option>
          <option value="Guinea">Guinea</option>
          <option value="Guinea-Bissau">Guinea-Bissau</option>
          <option value="Guyana">Guyana</option>
          <option value="Haiti">Haiti</option>
          <option value="Honduras">Honduras</option>
          <option value="Hong Kong">Hong Kong</option>
          <option value="Hungary">Hungary</option>
          <option value="Iceland">Iceland</option>
          <option value="India">India</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Iran">Iran</option>
          <option value="Iraq">Iraq</option>
          <option value="Ireland">Ireland</option>
          <option value="Israel">Israel</option>
          <option value="Italy">Italy</option>
          <option value="Jamaica">Jamaica</option>
          <option value="Japan">Japan</option>
          <option value="Jordan">Jordan</option>
          <option value="Kazakhstan">Kazakhstan</option>
          <option value="Kenya">Kenya</option>
          <option value="Kiribati">Kiribati</option>
          <option value="Korea, North">Korea, North</option>
          <option value="Korea, South">Korea, South</option>
          <option value="Kuwait">Kuwait</option>
          <option value="Kyrgyzstan">Kyrgyzstan</option>
          <option value="Laos">Laos</option>
          <option value="Latvia">Latvia</option>
          <option value="Lebanon">Lebanon</option>
          <option value="Lesotho">Lesotho</option>
          <option value="Liberia">Liberia</option>
          <option value="Libya">Libya</option>
          <option value="Liechtenstein">Liechtenstein</option>
          <option value="Lithuania">Lithuania</option>
          <option value="Luxembourg">Luxembourg</option>
          <option value="Macedonia">Macedonia</option>
          <option value="Madagascar">Madagascar</option>
          <option value="Malawi">Malawi</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Maldives">Maldives</option>
          <option value="Mali">Mali</option>
          <option value="Malta">Malta</option>
          <option value="Marshall Islands">Marshall Islands</option>
          <option value="Mauritania">Mauritania</option>
          <option value="Mauritius">Mauritius</option>
          <option value="Mexico">Mexico</option>
          <option value="Micronesia">Micronesia</option>
          <option value="Moldova">Moldova</option>
          <option value="Monaco">Monaco</option>
          <option value="Mongolia">Mongolia</option>
          <option value="Montenegro">Montenegro</option>
          <option value="Morocco">Morocco</option>
          <option value="Mozambique">Mozambique</option>
          <option value="Myanmar">Myanmar</option>
          <option value="Namibia">Namibia</option>
          <option value="Nauru">Nauru</option>
          <option value="Nepal">Nepal</option>
          <option value="Netherlands">Netherlands</option>
          <option value="New Zealand">New Zealand</option>
          <option value="Nicaragua">Nicaragua</option>
          <option value="Niger">Niger</option>
          <option value="Nigeria">Nigeria</option>
          <option value="Norway">Norway</option>
          <option value="Oman">Oman</option>
          <option value="Pakistan">Pakistan</option>
          <option value="Palau">Palau</option>
          <option value="Panama">Panama</option>
          <option value="Papua New Guinea">Papua New Guinea</option>
          <option value="Paraguay">Paraguay</option>
          <option value="Peru">Peru</option>
          <option value="Philippines">Philippines</option>
          <option value="Poland">Poland</option>
          <option value="Portugal">Portugal</option>
          <option value="Qatar">Qatar</option>
          <option value="Romania">Romania</option>
          <option value="Russia">Russia</option>
          <option value="Rwanda">Rwanda</option>
          <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
          <option value="Saint Lucia">Saint Lucia</option>
          <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
          <option value="Samoa">Samoa</option>
          <option value="San Marino">San Marino</option>
          <option value="Sao Tome and Principe">Sao Tome and Principe</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="Senegal">Senegal</option>
          <option value="Serbia">Serbia</option>
          <option value="Seychelles">Seychelles</option>
          <option value="Sierra Leone">Sierra Leone</option>
          <option value="Singapore">Singapore</option>
          <option value="Slovakia">Slovakia</option>
          <option value="Slovenia">Slovenia</option>
          <option value="Solomon Islands">Solomon Islands</option>
          <option value="Somalia">Somalia</option>
          <option value="South Africa">South Africa</option>
          <option value="South Sudan">South Sudan</option>
          <option value="Spain">Spain</option>
          <option value="Sri Lanka">Sri Lanka</option>
          <option value="Sudan">Sudan</option>
          <option value="Suriname">Suriname</option>
          <option value="Swaziland">Swaziland</option>
          <option value="Sweden">Sweden</option>
          <option value="Switzerland">Switzerland</option>
          <option value="Syria">Syria</option>
          <option value="Taiwan">Taiwan</option>
          <option value="Tajikistan">Tajikistan</option>
          <option value="Tanzania">Tanzania</option>
          <option value="Thailand">Thailand</option>
          <option value="Timor-Leste">Timor-Leste</option>
          <option value="Togo">Togo</option>
          <option value="Tonga">Tonga</option>
          <option value="Trinidad and Tobago">Trinidad and Tobago</option>
          <option value="Tunisia">Tunisia</option>
          <option value="Turkey">Turkey</option>
          <option value="Turkmenistan">Turkmenistan</option>
          <option value="Tuvalu">Tuvalu</option>
          <option value="Uganda">Uganda</option>
          <option value="Ukraine">Ukraine</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United States">United States</option>
          <option value="Uruguay">Uruguay</option>
          <option value="Uzbekistan">Uzbekistan</option>
          <option value="Vanuatu">Vanuatu</option>
          <option value="Vatican City">Vatican City</option>
          <option value="Venezuela">Venezuela</option>
          <option value="Vietnam">Vietnam</option>
          <option value="Yemen">Yemen</option>
          <option value="Zambia">Zambia</option>
          <option value="Zimbabwe">Zimbabwe</option>
        </select>
      </div>
    </div>
  </div>
</div>

            {/* Invoice Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Application / Certification Fee</span>
                <span className="text-2xl font-bold text-gray-900">$1,250.00</span>
              </div>
              <p className="text-sm text-gray-600">Payment Terms: Net 14 Days</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading || !scriptLoaded}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Invoice...
                  </>
                ) : !scriptLoaded ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading PDF Library...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Invoice & Continue to Dashboard
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/payment')}
                className="px-8 py-4 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Payment Options
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
