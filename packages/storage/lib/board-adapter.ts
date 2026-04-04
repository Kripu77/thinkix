import { db, type BoardDto } from './db';
import type { PlaitElement } from '@plait/core';

export interface BoardInfo {
  id: string;
  name: string;
  elementCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface BoardData {
  id: string;
  name: string;
  elements: PlaitElement[];
  viewport: { x: number; y: number; zoom: number };
}

let isInitialized = false;

async function ensureDb(): Promise<void> {
  if (!isInitialized) {
    await db.open();
    isInitialized = true;
  }
}

export const boardAdapter = {
  async list(): Promise<BoardInfo[]> {
    await ensureDb();
    const boards = await db.boards.toArray();
    return boards.map(b => ({
      id: b.id,
      name: b.name,
      elementCount: b.elements.length,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));
  },
  
  async get(id: string): Promise<BoardData | null> {
    await ensureDb();
    const board = await db.boards.get(id);
    if (!board) return null;
    return {
      id: board.id,
      name: board.name,
      elements: board.elements as PlaitElement[],
      viewport: board.viewport,
    };
  },
  
  async getByName(name: string): Promise<BoardData | null> {
    await ensureDb();
    const board = await db.boards.where('name').equals(name).first();
    if (!board) return null;
    return {
      id: board.id,
      name: board.name,
      elements: board.elements as PlaitElement[],
      viewport: board.viewport,
    };
  },
  
  async create(name: string): Promise<string> {
    await ensureDb();
    const now = Date.now();
    const id = crypto.randomUUID();
    const board: BoardDto = {
      id,
      name,
      elements: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: now,
      updatedAt: now,
    };
    await db.boards.add(board);
    return id;
  },
  
  async delete(id: string): Promise<void> {
    await ensureDb();
    await db.boards.delete(id);
    
    const activeMeta = await db.metadata.get('activeBoardId');
    if (activeMeta?.value === id) {
      await db.metadata.delete('activeBoardId');
    }
  },
  
  async setActive(id: string): Promise<void> {
    await ensureDb();
    await db.metadata.put({ key: 'activeBoardId', value: id });
  },
  
  async getActive(): Promise<string | null> {
    await ensureDb();
    const meta = await db.metadata.get('activeBoardId');
    return meta?.value ?? null;
  },
  
  async rename(id: string, name: string): Promise<void> {
    await ensureDb();
    await db.boards.update(id, { name, updatedAt: Date.now() });
  },
};
