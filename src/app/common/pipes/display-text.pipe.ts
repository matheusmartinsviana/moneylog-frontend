import { Pipe, type PipeTransform } from '@angular/core';

import { displayText } from '~/util/display-text';

@Pipe({ name: 'displayText' })
export class DisplayTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value == null ? '' : displayText(value);
  }
}
