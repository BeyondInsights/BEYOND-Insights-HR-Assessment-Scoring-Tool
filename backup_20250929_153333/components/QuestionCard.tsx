'use client'
import React from 'react'

interface QuestionCardProps {
  label: string
  description?: string
  children: React.ReactNode
}

export default function QuestionCard({ label, description, children }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-2">
        <span className="text-lg font-bold text-gray-900">{label}</span>
        <div>
          {description && <p className="text-base text-gray-700 leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="ml-8 space-y-3">{children}</div>
    </div>
  )
}
