import { Rule } from '@sanity/types'
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'site',
  title: '网站',
  type: 'document',
  fields: [
    defineField({
      name: 'url',
      title: '网址',
      type: 'url',
      validation: (rule: Rule) => rule.required()
    }),
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (rule: Rule) => rule.required()
    }),
    defineField({
      name: 'description',
      title: '描述',
      type: 'text'
    }),
    defineField({
      name: 'screenshot',
      title: '截图',
      type: 'image',
      options: {
        hotspot: true,
        storeOriginalFilename: false,
        accept: 'image/jpeg,image/png',
        metadata: ['dimensions', 'hasAlpha'],
      },
      // 添加删除规则
      weak: true,
      validation: (rule: Rule) => rule.custom((value: any, context: any) => {
        if (!value) return true
        if (!value.asset) return true
        return true
      })
    }),
    defineField({
      name: 'category',
      title: '分类',
      type: 'string',
      options: {
        list: [
          { title: '社交', value: 'social' },
          { title: '技术', value: 'tech' },
          { title: '新闻', value: 'news' },
          { title: '工具', value: 'tools' },
          { title: '其他', value: 'others' }
        ]
      },
      validation: (rule: Rule) => rule.required()
    }),
    defineField({
      name: 'status',
      title: '状态',
      type: 'string',
      options: {
        list: [
          { title: '正常', value: 'active' },
          { title: '待处理', value: 'pending' }
        ]
      },
      initialValue: 'pending'
    }),
    defineField({
      name: 'createdAt',
      title: '创建时间',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    })
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'screenshot'
    }
  }
}) 