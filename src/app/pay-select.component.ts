import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { LucideAngularModule, LucideChevronDown, LucideCheck } from '@lucide/angular';

@Component({
  selector: 'app-pay-select',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="pay-select">
      <button
        class="pay-select-trigger"
        type="button"
        (click)="toggle($event)"
        [class.open]="open()"
      >
        <span>{{ value }}</span>
        <svg lucideChevronDown size="15" class="chevron"></svg>
      </button>
      @if (open()) {
        <div class="pay-select-panel">
          @for (opt of options; track opt) {
            <button
              class="pay-select-item"
              type="button"
              [class.selected]="opt === value"
              (click)="select(opt)"
            >
              @if (opt === value) {
                <svg lucideCheck size="14"></svg>
              } @else {
                <span class="check-placeholder"></span>
              }
              {{ opt }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pay-select {
      position: relative;
      display: inline-block;
      width: 100%;
    }

    .pay-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      width: 100%;
      min-height: 40px;
      padding: 0 10px;
      border: 1px solid rgba(24, 24, 27, 0.12);
      border-radius: 8px;
      background: #ffffff;
      color: #18181b;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:focus,
      &.open {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.16);
      }

      .chevron {
        flex-shrink: 0;
        color: #71717a;
        transition: transform 0.15s;
      }

      &.open .chevron {
        transform: rotate(180deg);
      }
    }

    .pay-select-panel {
      position: absolute;
      z-index: 50;
      top: calc(100% + 4px);
      left: 0;
      min-width: 100%;
      padding: 4px;
      border: 1px solid rgba(24, 24, 27, 0.12);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(24, 24, 27, 0.12);
    }

    .pay-select-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 10px;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: #18181b;
      font-size: 0.875rem;
      font-weight: 450;
      cursor: pointer;
      text-align: left;

      &:hover {
        background: #f4f4f5;
      }

      &.selected {
        font-weight: 600;
      }

      .check-placeholder {
        display: inline-block;
        width: 14px;
        flex-shrink: 0;
      }
    }
  `],
})
export class PaySelectComponent {
  @Input() options: string[] = [];
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly icons = { LucideChevronDown, LucideCheck };
  open = signal(false);

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  select(option: string): void {
    this.valueChange.emit(option);
    this.open.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.open.set(false);
  }
}
