import { MERMAID_CONFIG, MERMAID_DOM_PREFIX } from '../constants';
import type {
  MermaidDiagramData,
  MermaidConfig,
  MermaidGraphImage,
} from '../types';
import type { MermaidLibrary } from '../mermaid-types';
import { parseFlowchartDiagram } from './flowchart';
import { parseSequenceDiagram } from './sequence';
import { parseClassDiagram } from './class';

let mermaidInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureMermaidInitialized(
  mermaid: MermaidLibrary,
  config: MermaidConfig
): Promise<void> {
  if (mermaidInitialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    mermaid.initialize(config);
    mermaidInitialized = true;
    initPromise = null;
  })();

  return initPromise;
}

function injectSvg(svg: string): { container: HTMLDivElement; cleanup: () => void } {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('DOM is not available. This function requires a browser environment.');
  }

  const container = document.createElement('div');
  container.id = `${MERMAID_DOM_PREFIX}-${Date.now()}`;
  container.setAttribute(
    'style',
    'position: absolute; visibility: hidden; pointer-events: none; z-index: -1;'
  );

  try {
    container.innerHTML = svg;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[injectSvg] Failed to set innerHTML:', err);
    const error = new Error(`Failed to inject SVG: ${message}`);
    error.cause = err;
    throw error;
  }

  let isAppended = false;
  try {
    document.body.appendChild(container);
    isAppended = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[injectSvg] Failed to append container to body:', err);
    const error = new Error(`Failed to append SVG container to DOM: ${message}`);
    error.cause = err;
    throw error;
  }

  const cleanup = () => {
    if (isAppended) {
      try {
        container.remove();
        isAppended = false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[injectSvg] Failed to cleanup container (ID: ${container.id}): ${message}`);
        console.warn('[injectSvg] This may cause a memory leak if multiple diagrams are parsed');
      }
    }
  };

  return { container, cleanup };
}

export async function parseMermaidDiagram(
  definition: string,
  config: MermaidConfig = MERMAID_CONFIG
): Promise<MermaidDiagramData> {
  let mermaid: MermaidLibrary;
  try {
    const imported = await import('mermaid');
    mermaid = (imported.default || imported) as unknown as MermaidLibrary;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[parseMermaidDiagram] Failed to load mermaid library:', errorMessage);
    const error = new Error('Failed to load mermaid library. Ensure "mermaid" is installed.');
    error.cause = err;
    throw error;
  }

  const finalConfig = {
    ...MERMAID_CONFIG,
    ...config,
    themeVariables: {
      ...MERMAID_CONFIG.themeVariables,
      ...config.themeVariables,
    },
  };

  await ensureMermaidInitialized(mermaid, finalConfig);

  const encodedDefinition = encodeEntities(definition);

  const diagram = await mermaid.mermaidAPI.getDiagramFromText(encodedDefinition);

  const diagramType = diagram.type;

  switch (diagramType) {
    case 'flowchart-v2':
    case 'flowchart':
      return await parseFlowchartDiagram(encodedDefinition, mermaid);

    case 'sequence':
      const { svg: seqSvg } = await mermaid.render(`${MERMAID_DOM_PREFIX}-seq-${Date.now()}`, encodedDefinition);
      const { container: seqContainer, cleanup: seqCleanup } = injectSvg(seqSvg);
      try {
        return await parseSequenceDiagram(diagram, seqContainer);
      } finally {
        seqCleanup();
      }

    case 'classDiagram':
    case 'classDiagram-V2':
      const { svg: classSvg } = await mermaid.render(`${MERMAID_DOM_PREFIX}-class-${Date.now()}`, encodedDefinition);
      const { container: classContainer, cleanup: classCleanup } = injectSvg(classSvg);
      try {
        return await parseClassDiagram(diagram, classContainer);
      } finally {
        classCleanup();
      }

    case 'stateDiagram':
    case 'erDiagram':
    case 'gitGraph':
    case 'pie':
    default:
      return await parseAsGraphImage(encodedDefinition, mermaid);
  }
}

/**
 * Encodes Mermaid entity codes to avoid parsing issues
 * Workaround for Mermaid's handling of #...; entities
 */
function encodeEntities(text: string): string {
  let txt = text;

  txt = txt.replace(/style.*:\S*#.*;/g, (s) => {
    return s.substring(0, s.length - 1);
  });
  txt = txt.replace(/classDef.*:\S*#.*;/g, (s) => {
    return s.substring(0, s.length - 1);
  });

  txt = txt.replace(/#\w+;/g, (s) => {
    const innerTxt = s.substring(1, s.length - 1);
    const isInt = /^\+?\d+$/.test(innerTxt);
    if (isInt) {
      return `°°${innerTxt}¶ß`;
    }
    return `°${innerTxt}¶ß`;
  });

  return txt;
}

/**
 * Parses an unsupported diagram type as a graph image
 * Renders to SVG and converts to a base64 data URL
 */
async function parseAsGraphImage(
  definition: string,
  mermaid: MermaidLibrary
): Promise<MermaidGraphImage> {
  const { svg } = await mermaid.render(`mermaid-to-thinkix-${Date.now()}`, definition);

  const container = document.createElement('div');
  container.setAttribute(
    'style',
    'opacity: 0; position: absolute; visibility: hidden; pointer-events: none; z-index: -1;'
  );
  container.innerHTML = svg;
  container.id = 'mermaid-diagram';

  let isAppended = false;
  try {
    document.body.appendChild(container);
    isAppended = true;

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found in rendered output');
    }

    const rect = svgElement.getBoundingClientRect();
    const width = Math.ceil(rect.width) || 800;
    const height = Math.ceil(rect.height) || 600;

    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));

    const svgString = svgElement.outerHTML;
    const encoded = btoa(unescape(encodeURIComponent(svgString)));
    const dataURL = `data:image/svg+xml;base64,${encoded}`;

    return {
      type: 'graphImage',
      mimeType: 'image/svg+xml',
      dataURL,
      width,
      height,
    };
  } finally {
    if (isAppended) {
      try {
        container.remove();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[parseAsGraphImage] Failed to cleanup container: ${message}`);
        console.warn('[parseAsGraphImage] This may cause a memory leak if multiple diagrams are parsed');
      }
    }
  }
}
