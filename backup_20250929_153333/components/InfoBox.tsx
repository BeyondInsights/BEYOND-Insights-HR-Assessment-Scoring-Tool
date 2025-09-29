'use client'
import React from 'react'

interface InfoBoxProps {
  title: string
  children: React.ReactNode
  color?: 'orange' | 'blue'
}

export default function InfoBox({ title, children, color = 'orange' }: InfoBoxProps) {
  const colorClasses =
    color === 'orange'
      ? 'bg-orange-50 border-l-4 border-orange-500 text-gray-800'
      : 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'

  return (
    <div className={`${colorClasses} p-6 my-6 rounded`}>
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="text-sm space-y-2">{children}</div>
    </div>
  )
}
