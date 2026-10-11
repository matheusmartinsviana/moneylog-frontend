import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { refractionFilter } from '~/app/common/components/liquid-glass/liquid-glass-filter';

@Directive({
  selector: '[appLiquidGlass]',
  host: { class: 'glass-lens' },
})
export class LiquidGlassDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly radius = input(14, { alias: 'appLiquidGlassRadius' });
  readonly strength = input(46, { alias: 'appLiquidGlassStrength' });

  constructor() {
    afterNextRender(() => {
      const element = this.el.nativeElement;
      const doc = element.ownerDocument;
      if (doc.documentElement.getAttribute('data-glass') !== 'refract') return;
      if (typeof ResizeObserver === 'undefined') return;
      const draw = (): void => {
        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        if (width < 8 || height < 8) return;
        element.style.backdropFilter = refractionFilter({
          width,
          height,
          radius: Math.min(this.radius(), Math.min(width, height) / 2),
          depth: 5,
          strength: this.strength(),
          chromaticAberration: 4,
        });
      };
      draw();
      const observer = new ResizeObserver(draw);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
