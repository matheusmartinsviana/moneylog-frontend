import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  OnInit,
} from '@angular/core';

import { Revealer } from '~/app/common/motion/reveal-engine';

@Directive({ selector: '[appReveal]' })
export class MotionRevealDirective implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly revealer = new Revealer(inject(DOCUMENT));
  readonly appReveal = input(0, { transform: (value: unknown) => numberAttribute(value, 0) });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revealer.disconnect());
  }

  ngOnInit(): void {
    this.revealer.setOffset(this.appReveal());
    this.revealer.observe(this.host);
  }
}
