export default {
  name: 'site',
  title: 'Site',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'url',
      title: 'URL',
      type: 'url',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'screenshot',
      title: 'Screenshot',
      type: 'image',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
    },
  ],
} 