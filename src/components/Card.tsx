'use client'

import React from 'react'
import Image from 'next/image'
import { urlForImage as urlFor } from '@/lib/sanity'

interface CardProps {
  _id: string
  title: string
  description: string
  url: string
  category: string
  screenshot?: any
  onDelete?: (id: string) => void
}

export function Card({
  _id,
  title,
  description,
  url,
  category,
  screenshot,
  onDelete
}: CardProps) {
  const handleClick = () => {
    window.open(url, '_blank')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm('确定要删除这个网站吗？')) {
      onDelete(_id)
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      social: '社交',
      tech: '技术',
      news: '新闻',
      tools: '工具',
      others: '其他'
    }
    return categories[category as keyof typeof categories] || '其他'
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      social: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      tech: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      news: 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      tools: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      others: 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    }
    return colors[category as keyof typeof colors] || colors.others
  }

  return (
    <div 
      className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={handleClick}
    >
      {/* 删除按钮 */}
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive group-hover:opacity-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* 截图区域 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {screenshot ? (
          <Image
            src={urlFor(screenshot).width(800).height(600).url()}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-semibold text-foreground">
            {title}
          </h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${getCategoryColor(category)}`}>
            {getCategoryLabel(category)}
          </span>
        </div>
        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
          {description || '暂无描述'}
        </p>
        <div className="truncate text-xs text-muted-foreground">
          {url}
        </div>
      </div>
    </div>
  )
} 