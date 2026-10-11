import { motionEnabled } from '~/app/common/motion/motion';

const PENDING = 'm-pending';
const ENTER = 'm-enter';
const seen = new WeakSet<Element>();

export class Revealer {
  private observer: IntersectionObserver | null = null;
  private offset = 0;

  constructor(private readonly doc: Document) {}

  setOffset(offset: number): void {
    this.offset = offset;
  }

  observe(element: Element): void {
    if (!(element instanceof HTMLElement) || seen.has(element)) return;
    seen.add(element);
    if (element.dataset['motionSkip'] !== undefined) return;
    if (!motionEnabled(this.doc) || typeof IntersectionObserver === 'undefined') return;
    if (this.doc.defaultView?.getComputedStyle(element).display === 'contents') return;
    element.classList.add(PENDING);
    this.getObserver().observe(element);
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private getObserver(): IntersectionObserver {
    this.observer ??= new IntersectionObserver(
      (entries) => {
        let index = this.offset;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.observer?.unobserve(entry.target);
          this.play(entry.target as HTMLElement, index++);
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    return this.observer;
  }

  private play(element: HTMLElement, index: number): void {
    element.style.setProperty('--m-i', String(index));
    element.classList.replace(PENDING, ENTER);
    if (!element.classList.contains(ENTER)) element.classList.add(ENTER);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      element.removeEventListener('animationend', onEnd);
      element.classList.remove(ENTER);
      element.style.removeProperty('--m-i');
    };
    const onEnd = (event: Event) => {
      if (event.target === element) finish();
    };
    element.addEventListener('animationend', onEnd);
    setTimeout(finish, 600 + 420 + 200);
  }
}
