import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PomodoroSegment } from '~/app/features/home/components/pomodoro-card/pomodoro.service';

@Component({
  selector: 'app-pomodoro-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pomodoro-clock.component.html',
  styleUrl: './pomodoro-clock.component.css',
})
export class PomodoroClockComponent {
  readonly digits = input.required<readonly (readonly PomodoroSegment[])[]>();
}
