import type { PlaitTheme } from '@plait/core';
import Dexie, { Table } from 'dexie';

export interface BoardDto {
  id: string;
  name: string;
  elements: unknown[];
  viewport: { x: number; y: number; zoom: number };
  theme?: PlaitTheme;
  createdAt: number;
  updatedAt: number;
}

export interface MetadataDto {
  key: string;
  value: string;
}

export class ThinkixDB extends Dexie {
  boards!: Table<BoardDto, string>;
  metadata!: Table<MetadataDto, string>;

  constructor() {
    super('thinkix-storage-v2');
    this.version(1).stores({
      boards: 'id, name, updatedAt',
      metadata: 'key',
    });
  }
}

export const db = new ThinkixDB();
