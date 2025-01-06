import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

interface CardProps {
  title: string
  description: string
  url: string
  screenshot: any
  category: string[]
}

export default function Card({ title, description, url, screenshot, category }: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 transition-all duration-300 hover:shadow-xl">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-video relative overflow-hidden">
          <Image
            src={urlFor(screenshot).url()}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            {category.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    </div>
  )
}
