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
      options: {
        list: [
          { title: '社交', value: 'social' },
          { title: '技术', value: 'tech' },
          { title: '新闻', value: 'news' },
          { title: '工具', value: 'tools' },
          { title: '其他', value: 'others' },
        ],
      },
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '正常', value: 'active' },
          { title: '待处理', value: 'pending' },
        ],
      },
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'url',
      media: 'screenshot'
    }
  }
} 