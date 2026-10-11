import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

import { I18nService } from '~/app/common/i18n/i18n.service';
import { ToastService, ToastTone } from '~/app/common/services/toast.service';

const MESSAGE = '.banner, [data-toast]';
const INTERACTIVE = 'button, a[href], input, select, textarea, [tabindex]';
const REPEAT_WINDOW_MS = 800;
const SUBMIT_REVIEW_DELAY_MS = 60;

@Injectable({ providedIn: 'root' })
export class FeedbackToastService {
  private readonly doc = inject(DOCUMENT);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);
  private readonly seen = new WeakMap<Element, string>();
  private lastMessage = '';
  private lastAt = 0;
  private started = false;

  start(): void {
    const view = this.doc.defaultView;
    if (this.started || !view || typeof view.MutationObserver !== 'function') return;
    this.started = true;
    new view.MutationObserver((records) => this.onMutations(records)).observe(this.doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.doc.addEventListener('submit', (event) => this.afterSubmit(event.target), true);
    this.doc.querySelectorAll(MESSAGE).forEach((element) => this.process(element));
  }

  private onMutations(records: readonly MutationRecord[]): void {
    const found = new Set<Element>();
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(MESSAGE)) found.add(node);
        node.querySelectorAll(MESSAGE).forEach((inner) => found.add(inner));
      });
      const target = record.target instanceof Element ? record.target : record.target.parentElement;
      const owner = target?.closest(MESSAGE);
      if (owner) found.add(owner);
    }
    found.forEach((element) => this.process(element));
  }

  private process(element: Element): void {
    if (!element.isConnected || element.querySelector(INTERACTIVE)) return;
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    element.setAttribute('data-toasted', '');
    if (!text || this.seen.get(element) === text) return;
    this.seen.set(element, text);
    this.show(text, element.getAttribute('role') === 'alert' ? 'error' : 'info');
  }

  private afterSubmit(target: EventTarget | null): void {
    if (!(target instanceof HTMLFormElement)) return;
    setTimeout(() => this.reviewForm(target), SUBMIT_REVIEW_DELAY_MS);
  }

  private reviewForm(form: HTMLFormElement): void {
    const field = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!field) return;
    this.show(this.describe(field), 'error');
    if (this.doc.activeElement !== field) field.focus();
  }

  private describe(field: HTMLElement): string {
    const ids = (field.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    let error = '';
    for (const id of ids) {
      const element = this.doc.getElementById(id);
      if (element?.classList.contains('field-error')) error = (element.textContent ?? '').trim();
    }
    const label = (field.closest('.field')?.querySelector('.field__label')?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (error && label) return `${label}: ${error}`;
    return error || this.i18n.t().form.reviewFields;
  }

  private show(message: string, tone: ToastTone): void {
    const now = Date.now();
    if (message === this.lastMessage && now - this.lastAt < REPEAT_WINDOW_MS) return;
    this.lastMessage = message;
    this.lastAt = now;
    this.toast.show(message, { tone });
  }
}
