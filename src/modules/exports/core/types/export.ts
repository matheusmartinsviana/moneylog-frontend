export interface DownloadedFile {
  readonly blob: Blob;
  readonly filename: string;
}

export interface TransactionsExportQuery {
  readonly from: string | null;
  readonly to: string | null;
  readonly language?: string | null;
}

export const CSV_HEADER_LANGUAGES = ['pt', 'en'] as const;

export function hasCsvHeader(language: string): boolean {
  return (CSV_HEADER_LANGUAGES as readonly string[]).includes(language);
}

export function csvHeaderLanguage(language: string): (typeof CSV_HEADER_LANGUAGES)[number] {
  return language === 'en' ? 'en' : 'pt';
}

export type ExportKind = 'csv' | 'backup';
