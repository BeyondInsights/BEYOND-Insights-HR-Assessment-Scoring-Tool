'use client'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CertificationPayment from '@/components/CertificationPayment'

export default function CreditCardPaymentPage() {
  const [companyData, setCompanyData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data from localStorage
    const name = localStorage.getItem('login_company_name')
    const firstName = localStorage.getItem('login_first_name')
    const lastName = localStorage.getItem('login_last_name')
    
    setCompanyData({
      name: name || '',
      contactName: `${firstName} ${lastName}`,
    })
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <CertificationPayment 
          companyData={companyData}
          score={85}
          isEligible={true}
        />
      </main>
      <Footer />
    </div>
  )
}
