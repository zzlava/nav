import { urlFor } from '@/lib/sanity'
import Image from 'next/image'

interface CardProps {
  site: {
    _id: string
    title: string
    description: string
    url: string
    category: string
    screenshot?: {
      asset?: {
        _ref: string
      }
    }
  }
  onDelete?: (id: string) => void
}

export default function Card({ site, onDelete }: CardProps) {
  const { _id, title, description, url, screenshot } = site
  const imageUrl = screenshot?.asset ? urlFor(screenshot).url() : null

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2">
      <div className="aspect-video overflow-hidden rounded-md">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={1280}
            height={800}
            className="object-cover transition-all hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <svg className="h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-none tracking-tight">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 hover:underline"
          >
            {title}
          </a>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(_id)}
          className="absolute right-2 top-2 rounded-md bg-background/80 p-2 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
          aria-label="删除"
        >
          <svg className="h-4 w-4 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}
