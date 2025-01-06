import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { MouseEvent } from 'react'

export interface CardProps {
  _id: string
  title: string
  description: string
  url: string
  screenshot?: any
  category: string
  onDelete?: (id: string) => void
}

export default function Card({ _id, title, description, url, screenshot, category, onDelete }: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 transition-all duration-300 hover:shadow-xl">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-video relative overflow-hidden">
          {screenshot && (
            <Image
              src={urlFor(screenshot).url()}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {category}
            </span>
          </div>
        </div>
      </a>
      {onDelete && (
        <button
          onClick={(e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(_id)
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
