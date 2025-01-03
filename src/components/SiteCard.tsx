'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlForImage } from '@/lib/sanity'

export default function SiteCard({ site, onDelete }: { site: any; onDelete?: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const imageUrl = site.screenshot?.asset?._ref 
    ? urlForImage(site.screenshot).width(600).url()
    : ''

  // 描述文本的最大长度
  const MAX_LENGTH = 50
  const isLongDescription = site.description?.length > MAX_LENGTH

  // 获取显示的描述文本
  const getDisplayDescription = () => {
    if (!isExpanded && isLongDescription) {
      return `${site.description.slice(0, MAX_LENGTH)}...`
    }
    return site.description
  }

  return (
    <div className="relative group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <a href={site.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative h-40 bg-gray-100">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={site.title}
              fill
              className="object-cover"
              priority={true}
            />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {site.title}
            </h3>
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
              {site.category === 'tools' && '工具'}
              {site.category === 'resources' && '资源'}
              {site.category === 'learning' && '学习'}
              {site.category === 'others' && '其他'}
            </span>
          </div>
          
          <div 
            className="relative"
            title={site.description}
          >
            <p className={`text-sm text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {getDisplayDescription()}
            </p>
            
            {isLongDescription && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="text-xs text-blue-500 hover:text-blue-600 mt-1"
              >
                {isExpanded ? '收起' : '展开'}
              </button>
            )}
          </div>
          
          <div className="mt-2 text-xs text-gray-500 truncate">
            {site.url}
          </div>
        </div>
      </a>
      
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(site._id)
          }}
          className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
} 