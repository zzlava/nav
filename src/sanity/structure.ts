import type { StructureResolver } from 'sanity/desk'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('内容')
    .items([
      S.listItem()
        .title('网站')
        .schemaType('site')
        .child(S.documentList().title('网站').filter('_type == "site"')),
    ])
