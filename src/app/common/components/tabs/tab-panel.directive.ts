import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[appTabPanel]' })
export class TabPanelDirective {
  readonly id = input.required<string>({ alias: 'appTabPanel' });
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
