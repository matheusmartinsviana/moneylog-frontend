import type { NoteLink, NoteLinkType } from '~/modules/notes/core/types/note';

export function linkRoute(
  type: NoteLinkType,
  id: string | null,
  key: string | null,
): string[] | null {
  switch (type) {
    case 'TRANSACTION':
      return id ? ['/transactions', id] : null;
    case 'GOAL':
      return id ? ['/goals', id] : null;
    case 'PERSON':
      return id ? ['/people', id] : null;
    case 'DEBT':
      return id ? ['/debts', id] : null;
    case 'CARD':
      return id ? ['/cards', id] : null;
    case 'ACCOUNT':
      return id ? ['/accounts', id, 'edit'] : null;
    case 'NOTE':
      return id ? ['/notes', id] : null;
    case 'MONTHLY_SUMMARY':
      return key ? ['/planning/summary', key] : null;
    case 'INVOICE':
      return null;
  }
}

export function routeOfLink(link: NoteLink): string[] | null {
  return link.target ? linkRoute(link.type, link.target.id, link.target.key) : null;
}
