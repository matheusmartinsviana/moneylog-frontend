import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type SessionEndHook = () => Observable<unknown>;

export const SESSION_END_HOOKS = new InjectionToken<readonly SessionEndHook[]>('SESSION_END_HOOKS');

export const SESSION_LOCAL_RESET_HOOKS = new InjectionToken<readonly SessionEndHook[]>(
  'SESSION_LOCAL_RESET_HOOKS',
);
