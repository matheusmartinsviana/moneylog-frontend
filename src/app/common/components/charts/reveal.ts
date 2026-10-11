import {
  afterNextRender,
  DestroyRef,
  ElementRef,
  inject,
  type Signal,
  signal,
} from '@angular/core';

export function revealOnEnter(): Signal<boolean> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroyRef = inject(DestroyRef);
  const animate =
    typeof IntersectionObserver !== 'undefined' &&
    !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pending = signal(animate);
  if (animate) {
    afterNextRender(() => {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          pending.set(false);
          observer.disconnect();
        }
      });
      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
  return pending.asReadonly();
}
