import { BaseGridRenderer, type GridRenderContext } from './base-renderer';

export class BlankRenderer extends BaseGridRenderer {
  readonly type = 'blank';
  
  render(_: GridRenderContext): void {
    this.clear();
  }
}
