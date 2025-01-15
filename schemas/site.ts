export default {
  name: 'site',
  title: '网站',
  type: 'document',
  fields: [
    {
      name: 'url',
      title: '网址',
      type: 'url',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'createdAt',
      title: '创建时间',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'status',
      title: '状态',
      type: 'string',
      options: {
        list: [
          { title: '待处理', value: 'pending' },
          { title: '处理中', value: 'processing' },
          { title: '已完成', value: 'completed' },
          { title: '失败', value: 'failed' }
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'lastProcessed',
      title: '最后处理时间',
      type: 'datetime',
    },
    {
      name: 'error',
      title: '错误信息',
      type: 'text',
    }
  ],
  preview: {
    select: {
      title: 'url',
      subtitle: 'status'
    }
  }
} 