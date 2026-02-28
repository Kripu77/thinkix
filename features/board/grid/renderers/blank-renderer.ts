import { BaseGridRenderer } from './base-renderer';

export class BlankRenderer extends BaseGridRenderer {
  readonly type = 'blank';
  
  render(): void {
    this.clear();
  }
}
