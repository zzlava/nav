import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schemaTypes } from '../schemas'

export default defineConfig({
  name: 'default',
  title: '网站导航',
  projectId: 'your-project-id',
  dataset: 'production',
  plugins: [deskTool()],
  schema: {
    types: schemaTypes,
  },
}) 