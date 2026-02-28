import { PlaitBoard, ThemeColorMode } from '@plait/core';
import type { BoardBackground, GridType, ViewportBounds } from './types';
import { DEFAULT_BOARD_BACKGROUND, GRID_BACKGROUND_COLORS, GRID_DENSITIES } from './types';
import type { GridDensity } from '@thinkix/shared';

const VALID_GRID_TYPES: GridType[] = ['dot', 'square', 'blueprint', 'isometric', 'ruled', 'blank'];
import { getViewportBounds } from './utils/world-to-screen';
import { getGridThemeColors, getBlueprintColors } from './utils/theme-colors';
import type { GridRenderer, GridRenderContext } from './renderers';
import {
  BlankRenderer,
  DotGridRenderer,
  SquareGridRenderer,
  BlueprintGridRenderer,
  IsometricGridRenderer,
  RuledGridRenderer,
} from './renderers';

const GRID_STORAGE_KEY = 'thinkix:grid-background';
const GRID_MAX_RETRIES = 10;
const GRID_INIT_DEBOUNCE_MS = 100;

export interface GridPluginState {
  config: BoardBackground
  renderer: GridRenderer | null
  container: SVGGElement | null
  animationFrameId: number | null
  initTimeoutId: number | null
  initRetryCount: number
  isDestroyed: boolean
}

const rendererFactories: Record<GridType, () => GridRenderer> = {
  blank: () => new BlankRenderer(),
  dot: () => new DotGridRenderer(),
  square: () => new SquareGridRenderer(),
  blueprint: () => new BlueprintGridRenderer(),
  isometric: () => new IsometricGridRenderer(),
  ruled: () => new RuledGridRenderer(),
}

export interface GridBoard extends PlaitBoard {
  getGridConfig: () => BoardBackground
  setGridConfig: (config: Partial<BoardBackground>) => void
  refreshGrid: () => void
  destroyGrid: () => void
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function isValidGridType(type: unknown): type is GridType {
  return typeof type === 'string' && VALID_GRID_TYPES.includes(type as GridType)
}

function isValidDensity(density: unknown): density is GridDensity {
  return typeof density === 'number' && GRID_DENSITIES.includes(density as GridDensity)
}

function getStoredGridConfig(): BoardBackground | null {
  if (!isBrowser()) return null
  try {
    const stored = localStorage.getItem(GRID_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (
        parsed &&
        typeof parsed === 'object' &&
        isValidGridType(parsed.type) &&
        (parsed.density === undefined || isValidDensity(parsed.density)) &&
        (parsed.showMajor === undefined || typeof parsed.showMajor === 'boolean')
      ) {
        return {
          type: parsed.type,
          density: parsed.density ?? DEFAULT_BOARD_BACKGROUND.density,
          showMajor: parsed.showMajor ?? DEFAULT_BOARD_BACKGROUND.showMajor,
        }
      }
      localStorage.removeItem(GRID_STORAGE_KEY)
    }
  } catch {
    return null
  }
  return null
}

function setStoredGridConfig(config: BoardBackground): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(config))
  } catch {
    console.warn('Failed to save grid config to localStorage')
  }
}

function createRenderer(type: GridType): GridRenderer {
  const factory = rendererFactories[type]
  return factory()
}

function renderGrid(state: GridPluginState, board: PlaitBoard): void {
  if (!state.container || !state.renderer || state.isDestroyed) return
  
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId)
  }
  
  state.animationFrameId = requestAnimationFrame(() => {
    if (!state.container || !state.renderer || state.isDestroyed) {
      state.animationFrameId = null
      return
    }
    
    try {
      const bounds: ViewportBounds = getViewportBounds(board)
      const zoom = board.viewport.zoom
      const theme = board.theme?.themeColorMode ?? ThemeColorMode.default
      
      let colors
      if (state.config.type === 'blueprint') {
        colors = getBlueprintColors(theme)
      } else {
        colors = getGridThemeColors(theme)
      }
      
      const context: GridRenderContext = {
        board,
        container: state.container,
        bounds,
        zoom,
        colors,
        config: state.config,
      }
      
      state.renderer.render(context)
    } catch (error) {
      console.error('Grid render error:', error)
    } finally {
      state.animationFrameId = null
    }
  })
}

function updateBackgroundStyle(state: GridPluginState, board: PlaitBoard): void {
  if (!isBrowser()) return
  
  const boardContainer = PlaitBoard.getBoardContainer(board)
  if (!boardContainer) return
  
  const theme = board.theme?.themeColorMode ?? ThemeColorMode.default
  let bgColor: string
  
  if (state.config.type === 'blueprint') {
    bgColor = getBlueprintColors(theme).background
  } else if (state.config.type === 'ruled') {
    bgColor = GRID_BACKGROUND_COLORS.ruled
  } else {
    bgColor = getGridThemeColors(theme).background
  }
  
  const svgHost = boardContainer.querySelector('.board-host-svg') as SVGSVGElement | null
  if (svgHost) {
    svgHost.style.backgroundColor = bgColor
  }
}

function cleanup(state: GridPluginState): void {
  state.isDestroyed = true;
  
  if (state.animationFrameId !== null) {
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;
  }
  
  if (state.initTimeoutId !== null) {
    clearTimeout(state.initTimeoutId);
    state.initTimeoutId = null;
  }
  
  if (state.renderer) {
    state.renderer.destroy();
    state.renderer = null;
  }
  
  if (state.container && state.container.parentNode) {
    state.container.remove();
  }
  state.container = null;
}

function initGrid(state: GridPluginState, board: PlaitBoard): void {
  if (state.isDestroyed) return
  
  const lowerHost = PlaitBoard.getElementLowerHost(board)
  
  if (!lowerHost) {
    if (state.initRetryCount >= GRID_MAX_RETRIES) {
        console.warn(`Grid init failed after ${GRID_MAX_RETRIES} attempts: lowerHost not available`)
        return
    }
    if (state.initTimeoutId !== null) {
      return
    }
    state.initRetryCount++
    state.initTimeoutId = setTimeout(() => {
      state.initTimeoutId = null
      initGrid(state, board)
    }, GRID_INIT_DEBOUNCE_MS) as unknown as number
    return
  }
  
  state.initRetryCount = 0
  
  let gridContainer = lowerHost.querySelector('.grid-layer') as SVGGElement | null
  if (!gridContainer) {
    gridContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    gridContainer.classList.add('grid-layer')
    lowerHost.appendChild(gridContainer)
  }
  
  state.container = gridContainer
  state.renderer = createRenderer(state.config.type)
  
  updateBackgroundStyle(state, board)
  renderGrid(state, board)
}

export function withGrid(board: PlaitBoard): PlaitBoard {
  const gridBoard = board as PlaitBoard & { __gridState?: GridPluginState }
  
  const storedConfig = getStoredGridConfig()
  const initialConfig: BoardBackground = storedConfig ?? DEFAULT_BOARD_BACKGROUND
  
  gridBoard.__gridState = {
    config: initialConfig,
    renderer: null,
    container: null,
    animationFrameId: null,
    initTimeoutId: null,
    initRetryCount: 0,
    isDestroyed: false,
  }
  
  const getState = (): GridPluginState => {
    return gridBoard.__gridState!
  }
  
  const handleSetGridConfig = (partialConfig: Partial<BoardBackground>) => {
    const state = getState()
    if (state.isDestroyed) return
    
    const newConfig = { ...state.config, ...partialConfig }
    
    if (newConfig.type !== state.config.type && state.renderer) {
      state.renderer.destroy()
      state.renderer = null
      state.container = null
    }
    
    state.config = newConfig
    setStoredGridConfig(newConfig)
    
    updateBackgroundStyle(state, board)
    
    if (!state.container) {
      initGrid(state, board)
    } else {
      renderGrid(state, board)
    }
  }
  
  const handleRefreshGrid = () => {
    const state = getState()
    if (state.isDestroyed) return
    updateBackgroundStyle(state, board)
    renderGrid(state, board)
  }
  
  const handleDestroyGrid = () => {
    const state = getState()
    cleanup(state)
  }
  
  const handleGetGridConfig = (): BoardBackground => {
    const state = getState()
    return { ...state.config }
  }
  
  ;(gridBoard as GridBoard).getGridConfig = handleGetGridConfig
  ;(gridBoard as GridBoard).setGridConfig = handleSetGridConfig
  ;(gridBoard as GridBoard).refreshGrid = handleRefreshGrid
  ;(gridBoard as GridBoard).destroyGrid = handleDestroyGrid
  
  const originalOnChange = board.onChange
  board.onChange = () => {
    originalOnChange()
    
    const state = getState()
    if (state.isDestroyed) return
    
    if (state.container && state.renderer) {
      renderGrid(state, board)
    } else if (!state.container) {
      initGrid(state, board)
    }
  }
  
  if (isBrowser()) {
    initGrid(getState(), board)
  }
  
  return gridBoard
}

export function getGridConfig(board: PlaitBoard): BoardBackground {
  const gridBoard = board as GridBoard
  if (typeof gridBoard.getGridConfig === 'function') {
    return gridBoard.getGridConfig()
  }
  return DEFAULT_BOARD_BACKGROUND
}

export function setGridConfig(
  board: PlaitBoard,
  config: Partial<BoardBackground>
): void {
  const gridBoard = board as GridBoard
  if (typeof gridBoard.setGridConfig === 'function') {
    gridBoard.setGridConfig(config)
  }
}

export function refreshGrid(board: PlaitBoard): void {
  const gridBoard = board as GridBoard
  if (typeof gridBoard.refreshGrid === 'function') {
    gridBoard.refreshGrid()
  }
}

export function destroyGrid(board: PlaitBoard): void {
  const gridBoard = board as GridBoard
  if (typeof gridBoard.destroyGrid === 'function') {
    gridBoard.destroyGrid()
  }
}
