declare module '@sanity/image-url' {
  interface ImageUrlBuilder {
    image: (source: any) => ImageUrlBuilder
    width: (width: number) => ImageUrlBuilder
    height: (height: number) => ImageUrlBuilder
    url: () => string
  }

  export default function imageUrlBuilder(client: any): {
    image: (source: any) => ImageUrlBuilder
  }
} 