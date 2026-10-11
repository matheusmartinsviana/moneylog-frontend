import { Observable } from 'rxjs';

import type { DownloadedFile, TransactionsExportQuery } from '~/modules/exports/core/types/export';

export abstract class ExportsGateway {
  abstract transactionsCsv(query: TransactionsExportQuery): Observable<DownloadedFile>;
  abstract backup(): Observable<DownloadedFile>;
}
