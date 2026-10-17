import { TestBed } from '@angular/core/testing';

import {
  VALUES_HIDDEN_STORAGE_KEY,
  ValuesVisibilityService,
} from '~/app/common/services/values-visibility.service';

describe('ValuesVisibilityService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('Dado nada salvo, então os valores começam visíveis', () => {
    expect(TestBed.inject(ValuesVisibilityService).hidden()).toBe(false);
  });

  it('Dado que o usuário oculta, então persiste e uma nova instância já nasce oculta', () => {
    TestBed.inject(ValuesVisibilityService).toggle();

    expect(localStorage.getItem(VALUES_HIDDEN_STORAGE_KEY)).toBe('1');
    TestBed.resetTestingModule();
    expect(TestBed.inject(ValuesVisibilityService).hidden()).toBe(true);
  });

  it('Dado valores ocultos, quando mostra de novo, então remove a preferência salva', () => {
    const service = TestBed.inject(ValuesVisibilityService);
    service.set(true);

    service.set(false);

    expect(service.hidden()).toBe(false);
    expect(localStorage.getItem(VALUES_HIDDEN_STORAGE_KEY)).toBeNull();
  });
});
