'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Building2, MapPin, Download, Loader2, AlertTriangle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCurrentUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

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
        amount: 1250
      }
      localStorage.setItem('invoice_data', JSON.stringify(invoiceData))

      // Generate PDF
      await generateInvoicePDF(invoiceData)
      
      // Grant access to dashboard
      localStorage.setItem('payment_method', 'invoice');
      localStorage.setItem('payment_completed', 'true');
      localStorage.setItem('payment_date', new Date().toISOString());

      // ALSO save to database
      try {
        const user = await getCurrentUser()
        if (user) {
