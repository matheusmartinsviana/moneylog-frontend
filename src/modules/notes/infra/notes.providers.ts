import { Provider } from '@angular/core';

import { NotesGateway } from '~/modules/notes/core/interfaces/notes.gateway';
import { VaultGateway } from '~/modules/notes/core/interfaces/vault.gateway';
import { NotesRequestsFacade } from '~/modules/notes/infra/facades/notes-requests.facade';
import { VaultRequestsFacade } from '~/modules/notes/infra/facades/vault-requests.facade';

export function provideNotes(): Provider[] {
  return [
    { provide: NotesGateway, useExisting: NotesRequestsFacade },
    { provide: VaultGateway, useExisting: VaultRequestsFacade },
  ];
}
