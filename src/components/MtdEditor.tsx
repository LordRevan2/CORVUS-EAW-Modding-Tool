import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Save,
  X,
  Image as ImageIcon,
  Search,
  Plus,
  Trash2,
  ImageOff,
  Maximize,
  ZoomIn,
  ZoomOut,
  Grid,
  List,
  Columns,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Move,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  FilePlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MtdIcon, serializeMtd } from '../lib/mtd';
import { useTranslation, useLanguage, tr } from '../i18n';
// @ts-ignore
import TGA from 'tga-js';

export function exportTGA(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx!.getImageData(0, 0, width, height).data;

  // 18 bytes for header, plus 26 bytes for TGA 2.0 footer
  const buffer = new ArrayBuffer(18 + width * height * 4 + 26);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Type: Uncompressed True-Color
  u8[2] = 2;
  view.setUint16(12, width, true);
  view.setUint16(14, height, true);
  u8[16] = 32; // 32 bits per pixel
  u8[17] = 40; // 8 alpha bits, Top-Left origin (bit 5 = 1) -> 32 + 8 = 40

  let offset = 18;
  const totalPixels = width * height;
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const a = imgData[idx + 3];

    if (a === 0) {
      u8[offset++] = 0; // B
      u8[offset++] = 0; // G
      u8[offset++] = 0; // R
      u8[offset++] = 0; // A
    } else {
      u8[offset++] = imgData[idx + 2]; // B
      u8[offset++] = imgData[idx + 1]; // G
      u8[offset++] = imgData[idx + 0]; // R
      u8[offset++] = a; // A
    }
  }

  // TGA 2.0 Signature Footer
  const signature = 'TRUEVISION-XFILE.';
  for (let i = 0; i < signature.length; i++) {
    u8[offset + 8 + i] = signature.charCodeAt(i);
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}

interface MtdEditorProps {
  initialIcons: MtdIcon[];
  fileName: string;
  initialTextureFile?: File | null;
  initialTextureDataUrl?: string | null;
  workspaceFiles?: File[];
  onClose: () => void;
  onError: (msg: string) => void;
}

type ViewMode = 'split' | 'table' | 'grid';
type FilterMode = 'all' | 'overlaps' | 'out_of_bounds' | 'alpha';
type SortField = 'name' | 'x' | 'y' | 'width' | 'height';

interface PendingIconItem {
  canvas: HTMLCanvasElement;
  previewUrl: string;
  w: number;
  h: number;
  name: string;
  hasAlpha: boolean;
}

const sortIconsByName = (iconsToSort: MtdIcon[]) => {
  return [...iconsToSort].sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};

export default function MtdEditor({
  initialIcons,
  fileName,
  initialTextureFile,
  initialTextureDataUrl,
  workspaceFiles = [],
  onClose,
  onError,
}: MtdEditorProps) {
  const t = useTranslation();
  const lang = useLanguage();

  const [icons, setIcons] = useState<MtdIcon[]>(() => sortIconsByName(initialIcons));
  const [selectedId, setSelectedId] = useState<string | null>(
    initialIcons.length > 0 ? initialIcons[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [textureSize, setTextureSize] = useState<{ w: number; h: number } | null>(null);
  const [activeTextureName, setActiveTextureName] = useState<string>(
    initialTextureFile?.name || fileName.replace(/\.[^/.]+$/, '') + '.tga'
  );

  // Pagination state to avoid rendering thousands of DOM nodes simultaneously
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(100);

  // View & Filter states
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Interactive Atlas Viewport states
  const [atlasZoom, setAtlasZoom] = useState<number>(1);
  const [atlasPan, setAtlasPan] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showOverlayBoxes, setShowOverlayBoxes] = useState<boolean>(true);
  const [showOverlayLabels, setShowOverlayLabels] = useState<boolean>(false);
  const [showPaddingGuides, setShowPaddingGuides] = useState<boolean>(false);

  // Lightweight drag/resize state (commits on mouseUp to avoid O(N) re-renders on every mousemove)
  const [draggingIconState, setDraggingIconState] = useState<{
    id: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    curX: number;
    curY: number;
    curW: number;
    curH: number;
  } | null>(null);

  // Upload & Replace states
  const [pendingUploads, setPendingUploads] = useState<PendingIconItem[]>([]);
  const [coordsEnabled, setCoordsEnabled] = useState(false);
  const [exportFormat, setExportFormat] = useState<'EAW_81' | 'ALAMO'>('EAW_81');
  const [saveWarningModal, setSaveWarningModal] = useState<{
    title: string;
    messages: string[];
    exportMode: 'both' | 'mtd' | 'tga';
  } | null>(null);
  const [manualEntryModal, setManualEntryModal] = useState<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    alpha: boolean;
  } | null>(null);

  const textureInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const replaceIconInputRef = useRef<HTMLInputElement>(null);
  const atlasViewportRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const masterAtlasCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // Sync a master HTMLCanvasElement into a lightweight blob: URL (avoids multi-MB base64 strings in DOM)
  const syncMasterCanvasToUrl = useCallback((canvas: HTMLCanvasElement) => {
    masterAtlasCanvasRef.current = canvas;
    setTextureSize({ w: canvas.width, h: canvas.height });

    canvas.toBlob((blob) => {
      if (!blob) {
        setTextureUrl(canvas.toDataURL('image/png'));
        return;
      }
      const nextUrl = URL.createObjectURL(blob);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
      activeBlobUrlRef.current = nextUrl;
      setTextureUrl(nextUrl);
    }, 'image/png');
  }, []);

  // Decode file (.TGA / .PNG / .JPG) directly into an HTMLCanvasElement
  const decodeImageFileToCanvas = useCallback(
    (file: File, onLoaded: (canvas: HTMLCanvasElement) => void) => {
      if (file.name.toLowerCase().endsWith('.tga')) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const tga = new TGA();
            tga.load(new Uint8Array(reader.result as ArrayBuffer));
            const tgaCanvas = tga.getCanvas() as HTMLCanvasElement;
            onLoaded(tgaCanvas);
          } catch (err: any) {
            onError('Error reading TGA: ' + (err?.message || String(err)));
          }
        };
        reader.onerror = () => onError('Failed to read TGA file.');
        reader.readAsArrayBuffer(file);
      } else {
        const objUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, img.width);
          canvas.height = Math.max(1, img.height);
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          onLoaded(canvas);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objUrl);
          onError('Failed to decode image file.');
        };
        img.src = objUrl;
      }
    },
    [onError]
  );

  // Load initial texture file or dataURL
  useEffect(() => {
    if (initialTextureFile) {
      decodeImageFileToCanvas(initialTextureFile, (canvas) => {
        setActiveTextureName(initialTextureFile.name);
        syncMasterCanvasToUrl(canvas);
      });
    } else if (initialTextureDataUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, img.width);
        canvas.height = Math.max(1, img.height);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        syncMasterCanvasToUrl(canvas);
      };
      img.src = initialTextureDataUrl;
    }
  }, [initialTextureFile, initialTextureDataUrl, decodeImageFileToCanvas, syncMasterCanvasToUrl]);

  const selectedIcon = useMemo(
    () => icons.find((i) => i.id === selectedId) || null,
    [icons, selectedId]
  );

  // Fast O(N log N) sweep-line diagnostics: Overlaps & Out-of-Bounds
  const diagnostics = useMemo(() => {
    const overlapIds = new Set<string>();
    const outOfBoundsIds = new Set<string>();
    const validIcons: MtdIcon[] = [];

    for (let i = 0; i < icons.length; i++) {
      const a = icons[i];
      if (
        a.width <= 0 ||
        a.height <= 0 ||
        a.x < 0 ||
        a.y < 0 ||
        (textureSize && (a.x + a.width > textureSize.w || a.y + a.height > textureSize.h))
      ) {
        outOfBoundsIds.add(a.id);
      }
      if (a.width > 0 && a.height > 0 && a.x >= 0 && a.y >= 0) {
        validIcons.push(a);
      }
    }

    // Sort by X ascending for fast sweep-line termination
    validIcons.sort((a, b) => a.x - b.x);

    const len = validIcons.length;
    for (let i = 0; i < len; i++) {
      const a = validIcons[i];
      const aRight = a.x + a.width;
      const aBottom = a.y + a.height;

      for (let j = i + 1; j < len; j++) {
        const b = validIcons[j];
        // Since sorted by X, if b.x >= aRight, no subsequent icon can overlap 'a' horizontally
        if (b.x >= aRight) break;

        if (a.y < b.y + b.height && aBottom > b.y) {
          overlapIds.add(a.id);
          overlapIds.add(b.id);
        }
      }
    }

    return { overlapIds, outOfBoundsIds };
  }, [icons, textureSize]);

  // Filtered & sorted list (using fast ASCII comparison instead of slow localeCompare)
  const filteredIcons = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    const list = icons.filter((i) => {
      if (q && !i.name.toUpperCase().includes(q)) return false;
      if (filterMode === 'overlaps') return diagnostics.overlapIds.has(i.id);
      if (filterMode === 'out_of_bounds') return diagnostics.outOfBoundsIds.has(i.id);
      if (filterMode === 'alpha') return Boolean(i.alpha);
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        if (a.name < b.name) cmp = -1;
        else if (a.name > b.name) cmp = 1;
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [icons, searchQuery, filterMode, diagnostics, sortField, sortAsc]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMode, sortField, sortAsc, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredIcons.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedIcons = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return filteredIcons.slice(start, start + itemsPerPage);
  }, [filteredIcons, safeCurrentPage, itemsPerPage]);

  // Select icon from Atlas canvas and jump to its page + scroll row into view
  const selectIconAndScroll = useCallback(
    (id: string) => {
      setSelectedId(id);
      const idx = filteredIcons.findIndex((i) => i.id === id);
      if (idx !== -1) {
        const targetPage = Math.floor(idx / itemsPerPage) + 1;
        if (targetPage !== safeCurrentPage) {
          setCurrentPage(targetPage);
        }
      }
      setTimeout(() => {
        const rowEl = rowRefs.current[id];
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 40);
    },
    [filteredIcons, itemsPerPage, safeCurrentPage]
  );

  // Draw all bounding boxes on a single hardware-accelerated <canvas> overlay (zero DOM bloat)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !textureSize) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showOverlayBoxes) return;

    ctx.font = 'bold 9px monospace';
    ctx.textBaseline = 'top';

    for (let i = 0; i < icons.length; i++) {
      const ic = icons[i];
      if (ic.width <= 0 || ic.height <= 0) continue;

      const isSel = ic.id === selectedId;
      // Selected icon is rendered by the interactive handle overlay when dragging
      const drawX =
        isSel && draggingIconState?.id === ic.id ? draggingIconState.curX : ic.x;
      const drawY =
        isSel && draggingIconState?.id === ic.id ? draggingIconState.curY : ic.y;
      const drawW =
        isSel && draggingIconState?.id === ic.id ? draggingIconState.curW : ic.width;
      const drawH =
        isSel && draggingIconState?.id === ic.id ? draggingIconState.curH : ic.height;

      const isOob = diagnostics.outOfBoundsIds.has(ic.id);
      const hasOverlap = diagnostics.overlapIds.has(ic.id);

      // Optional 2px safety padding guide
      if (showPaddingGuides) {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(drawX - 2, drawY - 2, drawW + 4, drawH + 4);
        ctx.setLineDash([]);
      }

      if (isSel) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, Math.max(1, drawW - 1), Math.max(1, drawH - 1));
      } else if (isOob) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, Math.max(1, drawW - 1), Math.max(1, drawH - 1));
      } else if (hasOverlap) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
        ctx.fillRect(drawX, drawY, drawW, drawH);
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, Math.max(1, drawW - 1), Math.max(1, drawH - 1));
      } else {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, Math.max(1, drawW - 1), Math.max(1, drawH - 1));
      }

      if (showOverlayLabels || isSel) {
        const shortLabel = ic.name
          .replace(/^I_BUTTON_/i, '')
          .replace(/\.TGA$/i, '')
          .slice(0, 14);
        const textW = Math.min(drawW, shortLabel.length * 5.5 + 4);
        ctx.fillStyle = isSel ? '#22d3ee' : 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(drawX, drawY, textW, 11);
        ctx.fillStyle = isSel ? '#020617' : '#fde68a';
        ctx.fillText(shortLabel, drawX + 2, drawY + 1, Math.max(8, drawW - 3));
      }
    }
  }, [
    icons,
    textureSize,
    selectedId,
    diagnostics,
    showOverlayBoxes,
    showOverlayLabels,
    showPaddingGuides,
    draggingIconState,
    viewMode,
  ]);

  // Focus selected icon on the Atlas Viewport
  const centerIconInAtlas = (icon: MtdIcon) => {
    if (!atlasViewportRef.current) return;
    const rect = atlasViewportRef.current.getBoundingClientRect();
    const targetZoom = Math.min(Math.max(atlasZoom, 1), 3);
    const centerX = rect.width / 2 - (icon.x + icon.width / 2) * targetZoom;
    const centerY = rect.height / 2 - (icon.y + icon.height / 2) * targetZoom;
    setAtlasZoom(targetZoom);
    setAtlasPan({ x: centerX, y: centerY });
  };

  const fitAtlasToViewport = () => {
    if (!atlasViewportRef.current || !textureSize) return;
    const rect = atlasViewportRef.current.getBoundingClientRect();
    const pad = 32;
    const scaleX = (rect.width - pad) / textureSize.w;
    const scaleY = (rect.height - pad) / textureSize.h;
    const nextZoom = Math.max(0.15, Math.min(2, Math.min(scaleX, scaleY)));
    setAtlasZoom(Number(nextZoom.toFixed(2)));
    setAtlasPan({
      x: Math.max(16, (rect.width - textureSize.w * nextZoom) / 2),
      y: Math.max(16, (rect.height - textureSize.h * nextZoom) / 2),
    });
  };

  const handleTextureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    decodeImageFileToCanvas(file, (canvas) => {
      setActiveTextureName(file.name);
      syncMasterCanvasToUrl(canvas);
    });
    if (textureInputRef.current) textureInputRef.current.value = '';
  };

  // Safe power-of-two calculation capped at 4096px to prevent infinite loops or OOM canvas allocations
  const getNextPowerOfTwo = (n: number) => {
    if (!Number.isFinite(n) || n <= 64) return 64;
    const MAX_ATLAS_DIM = 4096;
    let p = 64;
    while (p < n && p < MAX_ATLAS_DIM) {
      p *= 2;
    }
    return Math.min(p, MAX_ATLAS_DIM);
  };

  // Fast row-band + X-sweep free slot finder with 2px safety padding
  const findFreeSlot = (
    rawW: number,
    rawH: number,
    existingIcons: MtdIcon[],
    currentAtlasW: number,
    currentAtlasH: number
  ): { x: number; y: number; newAtlasW: number; newAtlasH: number } => {
    const PADDING = 2;
    const w = Math.max(1, Math.min(2048, Math.round(rawW)));
    const h = Math.max(1, Math.min(2048, Math.round(rawH)));
    const stepY = 2;

    let atlasW = Math.max(currentAtlasW || 256, getNextPowerOfTwo(w + PADDING * 2));
    let atlasH = Math.max(currentAtlasH || 256, getNextPowerOfTwo(h + PADDING * 2));

    // Filter only valid bounded icons and sort by X ascending once
    const validExisting = existingIcons
      .filter((ic) => ic.width > 0 && ic.height > 0 && ic.x >= 0 && ic.y >= 0 && ic.x < 8192 && ic.y < 8192)
      .sort((a, b) => a.x - b.x);

    const tryFindInDimensions = (maxW: number, maxH: number): { x: number; y: number } | null => {
      const limitY = maxH - h - PADDING;
      const limitX = maxW - w - PADDING;

      for (let y = PADDING; y <= limitY; y += stepY) {
        // Pre-filter icons that vertically intersect [y - PADDING, y + h + PADDING]
        const bandTop = y;
        const bandBottom = y + h + PADDING;
        const rowIcons: MtdIcon[] = [];
        for (let i = 0; i < validExisting.length; i++) {
          const ic = validExisting[i];
          if (bandTop < ic.y + ic.height + PADDING && bandBottom > ic.y) {
            rowIcons.push(ic);
          }
        }

        let x = PADDING;
        while (x <= limitX) {
          let collision = false;
          for (let i = 0; i < rowIcons.length; i++) {
            const ic = rowIcons[i];
            if (ic.x + ic.width + PADDING <= x) continue;
            if (ic.x >= x + w + PADDING) break; // Sorted by X: no further icon in rowIcons can collide
            // Collision found: jump x right past this icon
            x = ic.x + ic.width + PADDING;
            collision = true;
            break;
          }
          if (!collision && x <= limitX) {
            return { x, y };
          }
        }
      }
      return null;
    };

    const found = tryFindInDimensions(atlasW, atlasH);
    if (found) {
      return { x: found.x, y: found.y, newAtlasW: atlasW, newAtlasH: atlasH };
    }

    // Expand height or width to next power of two
    if (atlasH <= atlasW && atlasH < 4096) {
      const nextH = getNextPowerOfTwo(atlasH + h + PADDING * 2);
      const expanded = tryFindInDimensions(atlasW, nextH);
      if (expanded) {
        return { x: expanded.x, y: expanded.y, newAtlasW: atlasW, newAtlasH: nextH };
      }
      return { x: PADDING, y: atlasH + PADDING, newAtlasW: atlasW, newAtlasH: nextH };
    } else if (atlasW < 4096) {
      const nextW = getNextPowerOfTwo(atlasW + w + PADDING * 2);
      const expanded = tryFindInDimensions(nextW, atlasH);
      if (expanded) {
        return { x: expanded.x, y: expanded.y, newAtlasW: nextW, newAtlasH: atlasH };
      }
    }

    const fallbackH = Math.min(8192, Math.max(atlasH + h + PADDING * 2, getNextPowerOfTwo(atlasH * 2)));
    return { x: PADDING, y: atlasH + PADDING, newAtlasW: atlasW, newAtlasH: fallbackH };
  };

  const detectCanvasAlpha = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pxData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let p = 3; p < pxData.length; p += 4) {
      if (pxData[p] < 255) return true;
    }
    return false;
  };

  const formatEawIconName = (rawName: string): string => {
    let name = rawName.replace(/\.[^/.]+$/, '').toUpperCase().replace(/\s+/g, '_');
    if (!name.startsWith('I_BUTTON_')) name = 'I_BUTTON_' + name;
    if (!name.endsWith('.TGA')) name = name + '.TGA';
    return name;
  };

  // Single or Batch icon upload handler
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const loadedItems: PendingIconItem[] = [];
    let processed = 0;

    files.forEach((file) => {
      decodeImageFileToCanvas(file, (iconCanvas) => {
        const hasAlpha = detectCanvasAlpha(iconCanvas);
        loadedItems.push({
          canvas: iconCanvas,
          previewUrl: iconCanvas.toDataURL('image/png'),
          w: iconCanvas.width,
          h: iconCanvas.height,
          name: formatEawIconName(file.name),
          hasAlpha,
        });
        processed++;
        if (processed === files.length) {
          setPendingUploads(loadedItems);
        }
      });
    });

    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  // Confirm single or batch icon upload & pack onto master texture canvas
  const confirmPendingUploads = () => {
    if (pendingUploads.length === 0) return;

    const existingNames = new Set(icons.map((i) => i.name.toUpperCase()));
    const batchNames = new Set<string>();
    for (const item of pendingUploads) {
      const cleanName = item.name.trim().toUpperCase();
      if (!cleanName) {
        onError(
          tr(
            lang,
            'Icon name cannot be empty.',
            'El nombre del icono no puede estar vacío.',
            "Le nom de l'icône ne peut pas être vide."
          )
        );
        return;
      }
      if (existingNames.has(cleanName) || batchNames.has(cleanName)) {
        onError(
          tr(
            lang,
            `An icon named '${cleanName}' already exists in this .MTD.`,
            `Ya existe un icono llamado '${cleanName}' en este archivo .MTD.`,
            `Une icône nommée '${cleanName}' existe déjà dans ce fichier .MTD.`
          )
        );
        return;
      }
      batchNames.add(cleanName);
    }

    const baseCanvas = masterAtlasCanvasRef.current;
    let currentW = baseCanvas ? baseCanvas.width : textureSize?.w || 256;
    let currentH = baseCanvas ? baseCanvas.height : textureSize?.h || 256;

    icons.forEach((ic) => {
      if (ic.x >= 0 && ic.width > 0 && ic.x + ic.width <= 4096) {
        if (ic.x + ic.width > currentW) currentW = getNextPowerOfTwo(ic.x + ic.width);
      }
      if (ic.y >= 0 && ic.height > 0 && ic.y + ic.height <= 4096) {
        if (ic.y + ic.height > currentH) currentH = getNextPowerOfTwo(ic.y + ic.height);
      }
    });

    const workingIcons = [...icons];
    const placements: { item: PendingIconItem; icon: MtdIcon }[] = [];

    for (const item of pendingUploads) {
      const slot = findFreeSlot(item.w, item.h, workingIcons, currentW, currentH);
      currentW = slot.newAtlasW;
      currentH = slot.newAtlasH;

      const newIcon: MtdIcon = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name: item.name.trim().toUpperCase(),
        x: slot.x,
        y: slot.y,
        width: item.w,
        height: item.h,
        alpha: item.hasAlpha,
      };
      workingIcons.push(newIcon);
      placements.push({ item, icon: newIcon });
    }

    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = currentW;
    nextCanvas.height = currentH;
    const ctx = nextCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, currentW, currentH);
      if (baseCanvas) {
        ctx.drawImage(baseCanvas, 0, 0);
      }
      placements.forEach(({ item, icon }) => {
        ctx.drawImage(item.canvas, icon.x, icon.y, icon.width, icon.height);
      });
    }

    syncMasterCanvasToUrl(nextCanvas);
    setIcons(sortIconsByName(workingIcons));
    if (placements.length > 0) {
      setSelectedId(placements[placements.length - 1].icon.id);
    }
    setPendingUploads([]);
  };

  // Replace Graphic of Selected Icon in-place
  const handleReplaceSelectedIconGraphic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedIcon) return;

    decodeImageFileToCanvas(file, (newIconCanvas) => {
      const hasAlpha = detectCanvasAlpha(newIconCanvas);
      const baseCanvas = masterAtlasCanvasRef.current;

      if (baseCanvas) {
        const w = newIconCanvas.width;
        const h = newIconCanvas.height;
        let targetX = selectedIcon.x;
        let targetY = selectedIcon.y;
        let atlasW = baseCanvas.width;
        let atlasH = baseCanvas.height;

        const otherIcons = icons.filter((i) => i.id !== selectedIcon.id);
        const fitsInPlace =
          targetX >= 0 &&
          targetY >= 0 &&
          targetX + w <= atlasW &&
          targetY + h <= atlasH &&
          !otherIcons.some(
            (ic) =>
              targetX < ic.x + ic.width &&
              targetX + w > ic.x &&
              targetY < ic.y + ic.height &&
              targetY + h > ic.y
          );

        if (!fitsInPlace) {
          const slot = findFreeSlot(w, h, otherIcons, atlasW, atlasH);
          targetX = slot.x;
          targetY = slot.y;
          atlasW = slot.newAtlasW;
          atlasH = slot.newAtlasH;
        }

        const nextCanvas = document.createElement('canvas');
        nextCanvas.width = atlasW;
        nextCanvas.height = atlasH;
        const ctx = nextCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, atlasW, atlasH);
          ctx.drawImage(baseCanvas, 0, 0);
          ctx.clearRect(
            selectedIcon.x,
            selectedIcon.y,
            selectedIcon.width,
            selectedIcon.height
          );
          ctx.drawImage(newIconCanvas, targetX, targetY, w, h);
        }

        syncMasterCanvasToUrl(nextCanvas);
        handleUpdate(selectedIcon.id, {
          x: targetX,
          y: targetY,
          width: w,
          height: h,
          alpha: hasAlpha,
        });
      } else {
        handleUpdate(selectedIcon.id, {
          width: newIconCanvas.width,
          height: newIconCanvas.height,
          alpha: hasAlpha,
        });
      }
    });

    if (replaceIconInputRef.current) replaceIconInputRef.current.value = '';
  };

  // Export single selected icon as .PNG or .TGA directly from master canvas
  const exportSingleIcon = (icon: MtdIcon, format: 'png' | 'tga') => {
    const baseCanvas = masterAtlasCanvasRef.current;
    if (!baseCanvas) {
      onError(
        tr(
          lang,
          'Load a texture atlas first to extract and export individual icons.',
          'Carga primero una textura de atlas para extraer y exportar iconos individuales.',
          "Chargez d'abord une texture d'atlas pour extraire et exporter des icônes individuelles."
        )
      );
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, icon.width);
    canvas.height = Math.max(1, icon.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      baseCanvas,
      icon.x,
      icon.y,
      icon.width,
      icon.height,
      0,
      0,
      icon.width,
      icon.height
    );

    const baseName = icon.name.replace(/\.[^/.]+$/, '');
    if (format === 'tga') {
      const blob = exportTGA(canvas);
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${baseName}.tga`);
    } else {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${baseName}.png`);
      }, 'image/png');
    }
  };

  // Repack a colliding/out-of-bounds icon into a free 2px-padded slot
  const repackSingleIcon = (icon: MtdIcon) => {
    const otherIcons = icons.filter((i) => i.id !== icon.id);
    const baseCanvas = masterAtlasCanvasRef.current;
    const curW = baseCanvas?.width || textureSize?.w || 512;
    const curH = baseCanvas?.height || textureSize?.h || 512;
    const safeW = Math.max(1, Math.min(2048, icon.width || 64));
    const safeH = Math.max(1, Math.min(2048, icon.height || 48));

    const slot = findFreeSlot(safeW, safeH, otherIcons, curW, curH);

    if (baseCanvas) {
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = slot.newAtlasW;
      nextCanvas.height = slot.newAtlasH;
      const ctx = nextCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        ctx.drawImage(baseCanvas, 0, 0);

        if (icon.width > 0 && icon.height > 0 && icon.x >= 0 && icon.y >= 0) {
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = safeW;
          cropCanvas.height = safeH;
          const cropCtx = cropCanvas.getContext('2d');
          cropCtx?.drawImage(
            baseCanvas,
            icon.x,
            icon.y,
            safeW,
            safeH,
            0,
            0,
            safeW,
            safeH
          );

          if (!diagnostics.overlapIds.has(icon.id)) {
            ctx.clearRect(icon.x, icon.y, safeW, safeH);
          }
          ctx.drawImage(cropCanvas, slot.x, slot.y);
        }

        syncMasterCanvasToUrl(nextCanvas);
      }
    }

    handleUpdate(icon.id, {
      x: slot.x,
      y: slot.y,
      width: safeW,
      height: safeH,
    });
  };

  const handleDuplicateIcon = (icon: MtdIcon) => {
    const base = icon.name.replace(/\.tga$/i, '');
    let candidate = `${base}_COPY.TGA`;
    let counter = 2;
    const existingSet = new Set(icons.map((i) => i.name.toUpperCase()));
    while (existingSet.has(candidate.toUpperCase())) {
      candidate = `${base}_COPY_${counter}.TGA`;
      counter++;
    }

    const newIcon: MtdIcon = {
      ...icon,
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: candidate,
    };
    setIcons((prev) => sortIconsByName([...prev, newIcon]));
    setSelectedId(newIcon.id);
  };

  const handleCreateManualEntry = () => {
    if (!manualEntryModal) return;
    let name = manualEntryModal.name.trim().toUpperCase();
    if (!name) return;
    if (!name.endsWith('.TGA')) name += '.TGA';

    if (icons.some((i) => i.name.toUpperCase() === name)) {
      onError(
        tr(
          lang,
          `An icon named '${name}' already exists.`,
          `Ya existe un icono llamado '${name}'.`,
          `Une icône nommée '${name}' existe déjà.`
        )
      );
      return;
    }

    const newIcon: MtdIcon = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name,
      x: Math.max(0, Math.round(manualEntryModal.x)),
      y: Math.max(0, Math.round(manualEntryModal.y)),
      width: Math.max(1, Math.round(manualEntryModal.width)),
      height: Math.max(1, Math.round(manualEntryModal.height)),
      alpha: manualEntryModal.alpha,
    };

    setIcons((prev) => sortIconsByName([...prev, newIcon]));
    setSelectedId(newIcon.id);
    setManualEntryModal(null);
  };

  const handleUpdate = (id: string, updates: Partial<MtdIcon>) => {
    if (updates.name !== undefined) {
      if (icons.some((i) => i.name === updates.name && i.id !== id)) {
        onError(`An icon named '${updates.name}' already exists.`);
        return;
      }
    }
    setIcons((prev) => {
      const next = prev.map((icon) => (icon.id === id ? { ...icon, ...updates } : icon));
      if (updates.name !== undefined && sortField === 'name') return sortIconsByName(next);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    const iconToDelete = icons.find((i) => i.id === id);
    const baseCanvas = masterAtlasCanvasRef.current;

    if (iconToDelete && baseCanvas && !diagnostics.overlapIds.has(id)) {
      const ctx = baseCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(iconToDelete.x, iconToDelete.y, iconToDelete.width, iconToDelete.height);
        syncMasterCanvasToUrl(baseCanvas);
      }
    }
    setIcons((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const triggerDownload = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const executeExport = (exportMode: 'both' | 'mtd' | 'tga') => {
    try {
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const textureName = baseName + '.tga';

      if (exportMode === 'both' || exportMode === 'mtd') {
        const buffer = serializeMtd(icons, textureName, exportFormat);
        const mtdBlob = new Blob([buffer], { type: 'application/octet-stream' });
        const mtdUrl = URL.createObjectURL(mtdBlob);
        triggerDownload(mtdUrl, baseName + '.mtd');
      }

      if ((exportMode === 'both' || exportMode === 'tga') && masterAtlasCanvasRef.current) {
        const canvasToExport = masterAtlasCanvasRef.current;
        setTimeout(
          () => {
            const tgaBlob = exportTGA(canvasToExport);
            const tgaUrl = URL.createObjectURL(tgaBlob);
            triggerDownload(tgaUrl, baseName + '.tga');
          },
          exportMode === 'both' ? 300 : 20
        );
      }
      setSaveWarningModal(null);
    } catch (err: any) {
      onError(err.message);
    }
  };

  const handleRequestExport = (exportMode: 'both' | 'mtd' | 'tga' = 'both') => {
    const warnings: string[] = [];
    const zeroSize = icons.filter((i) => i.width <= 0 || i.height <= 0);
    if (zeroSize.length > 0) {
      warnings.push(
        tr(
          lang,
          `${zeroSize.length} icon(s) have 0 width or height (e.g. ${zeroSize[0].name}). They will be invisible in-game.`,
          `${zeroSize.length} icono(s) tienen ancho o alto 0 (ej. ${zeroSize[0].name}). Serán invisibles en el juego.`,
          `${zeroSize.length} icône(s) ont une largeur ou hauteur de 0 (ex: ${zeroSize[0].name}). Elles seront invisibles en jeu.`
        )
      );
    }

    if (textureSize) {
      const outOfBounds = icons.filter(
        (i) =>
          i.x < 0 ||
          i.y < 0 ||
          i.x + i.width > textureSize.w ||
          i.y + i.height > textureSize.h
      );
      if (outOfBounds.length > 0) {
        warnings.push(
          tr(
            lang,
            `${outOfBounds.length} icon(s) exceed the texture dimensions (${textureSize.w}×${textureSize.h}), e.g. ${outOfBounds[0].name}. This can crash the Alamo Engine.`,
            `${outOfBounds.length} icono(s) exceden los límites de la textura (${textureSize.w}×${textureSize.h}), ej. ${outOfBounds[0].name}. Esto puede provocar un cierre inesperado en el motor Alamo.`,
            `${outOfBounds.length} icône(s) dépassent les limites de la texture (${textureSize.w}×${textureSize.h}), ex: ${outOfBounds[0].name}. Cela peut faire planter le moteur Alamo.`
          )
        );
      }
    }

    if (warnings.length > 0) {
      setSaveWarningModal({
        title: tr(
          lang,
          'Atlas Diagnostic Warning Before Export',
          'Advertencia de Diagnóstico del Atlas antes de Exportar',
          "Avertissement de Diagnostic de l'Atlas avant Exportation"
        ),
        messages: warnings,
        exportMode,
      });
      return;
    }

    executeExport(exportMode);
  };

  // Interactive Atlas Mouse Handlers (Mathematical hit-testing instead of 3,000 DOM nodes)
  const handleAtlasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setAtlasZoom((z) => Number(Math.max(0.15, Math.min(4, z + delta)).toFixed(2)));
  };

  const handleAtlasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    if (atlasViewportRef.current && textureSize && showOverlayBoxes) {
      const rect = atlasViewportRef.current.getBoundingClientRect();
      const texX = (e.clientX - rect.left - atlasPan.x) / atlasZoom;
      const texY = (e.clientY - rect.top - atlasPan.y) / atlasZoom;

      if (texX >= 0 && texY >= 0 && texX <= textureSize.w && texY <= textureSize.h) {
        // Check if user clicked on an icon box (prefer smaller/topmost icon)
        let hitIcon: MtdIcon | null = null;
        for (let i = icons.length - 1; i >= 0; i--) {
          const ic = icons[i];
          if (
            ic.width > 0 &&
            ic.height > 0 &&
            texX >= ic.x &&
            texX <= ic.x + ic.width &&
            texY >= ic.y &&
            texY <= ic.y + ic.height
          ) {
            hitIcon = ic;
            break;
          }
        }

        if (hitIcon) {
          selectIconAndScroll(hitIcon.id);
          if (coordsEnabled) {
            setDraggingIconState({
              id: hitIcon.id,
              mode: 'move',
              startX: e.clientX,
              startY: e.clientY,
              origX: hitIcon.x,
              origY: hitIcon.y,
              origW: hitIcon.width,
              origH: hitIcon.height,
              curX: hitIcon.x,
              curY: hitIcon.y,
              curW: hitIcon.width,
              curH: hitIcon.height,
            });
            return;
          }
        }
      }
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - atlasPan.x, y: e.clientY - atlasPan.y });
  };

  const handleAtlasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingIconState) {
      const dx = Math.round((e.clientX - draggingIconState.startX) / atlasZoom);
      const dy = Math.round((e.clientY - draggingIconState.startY) / atlasZoom);

      if (draggingIconState.mode === 'move') {
        const nextX = Math.max(0, draggingIconState.origX + dx);
        const nextY = Math.max(0, draggingIconState.origY + dy);
        setDraggingIconState((prev) =>
          prev ? { ...prev, curX: nextX, curY: nextY } : null
        );
      } else {
        const nextW = Math.max(1, draggingIconState.origW + dx);
        const nextH = Math.max(1, draggingIconState.origH + dy);
        setDraggingIconState((prev) =>
          prev ? { ...prev, curW: nextW, curH: nextH } : null
        );
      }
      return;
    }

    if (isPanning) {
      setAtlasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleAtlasMouseUp = () => {
    if (draggingIconState) {
      const { id, mode, curX, curY, curW, curH } = draggingIconState;
      setDraggingIconState(null);
      if (mode === 'move') {
        handleUpdate(id, { x: curX, y: curY });
      } else {
        handleUpdate(id, { width: curW, height: curH });
      }
    }
    setIsPanning(false);
  };

  // Workspace texture files (.tga, .png)
  const workspaceTextures = useMemo(
    () =>
      workspaceFiles.filter((f) => {
        const low = f.name.toLowerCase();
        return low.endsWith('.tga') || low.endsWith('.png') || low.endsWith('.jpg');
      }),
    [workspaceFiles]
  );

  // Shared CSS variable for the texture blob URL so thumbnails never duplicate URL strings
  const rootAtlasStyle = useMemo(
    () =>
      textureUrl
        ? ({ '--mtd-atlas-url': `url("${textureUrl}")` } as React.CSSProperties)
        : undefined,
    [textureUrl]
  );

  return (
    <div
      style={rootAtlasStyle}
      className="flex-1 flex flex-col bg-slate-950 font-sans overflow-hidden relative select-none"
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={iconInputRef}
        onChange={handleIconUpload}
        className="hidden"
        accept=".tga,.png,.jpg,.jpeg"
        multiple
      />
      <input
        type="file"
        ref={replaceIconInputRef}
        onChange={handleReplaceSelectedIconGraphic}
        className="hidden"
        accept=".tga,.png,.jpg,.jpeg"
      />
      <input
        type="file"
        ref={textureInputRef}
        onChange={handleTextureUpload}
        className="hidden"
        accept=".tga,.png,.jpg,.jpeg"
      />

      {/* Editor Header — Unified Tactical HUD (v1.3) */}
      <div className="h-14 bg-slate-900/85 backdrop-blur-md border-b border-amber-900/40 flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/40 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <ImageIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold font-mono">
                {t.mtdEditor.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-950/90 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                v1.3
              </span>
              <span className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-300 uppercase">
                {icons.length} {t.mtdEditor.iconsCount}{' '}
                {textureSize
                  ? `// ${textureSize.w}×${textureSize.h}px`
                  : `// ${tr(lang, 'NO TEXTURE', 'SIN TEXTURA', 'SANS TEXTURE')}`}
              </span>
              {diagnostics.overlapIds.size > 0 && (
                <button
                  onClick={() =>
                    setFilterMode(filterMode === 'overlaps' ? 'all' : 'overlaps')
                  }
                  className="px-1.5 py-0.5 rounded-sm bg-orange-950/90 border border-orange-500/50 text-[9px] font-mono font-bold text-orange-300 uppercase flex items-center space-x-1 cursor-pointer hover:bg-orange-900/60"
                  title={tr(
                    lang,
                    'Filter overlapping icons',
                    'Filtrar iconos solapados',
                    'Filtrer les icônes qui se chevauchent'
                  )}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>
                    {diagnostics.overlapIds.size}{' '}
                    {tr(lang, 'OVERLAPS', 'SOLAPADOS', 'COLLISIONS')}
                  </span>
                </button>
              )}
              {diagnostics.outOfBoundsIds.size > 0 && (
                <button
                  onClick={() =>
                    setFilterMode(
                      filterMode === 'out_of_bounds' ? 'all' : 'out_of_bounds'
                    )
                  }
                  className="px-1.5 py-0.5 rounded-sm bg-red-950/90 border border-red-500/50 text-[9px] font-mono font-bold text-red-300 uppercase flex items-center space-x-1 cursor-pointer hover:bg-red-900/60"
                  title={tr(
                    lang,
                    'Filter out-of-bounds icons',
                    'Filtrar iconos fuera de rango',
                    'Filtrer les icônes hors limites'
                  )}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>
                    {diagnostics.outOfBoundsIds.size}{' '}
                    {tr(lang, 'OUT OF BOUNDS', 'FUERA DE LÍMITE', 'HORS LIMITES')}
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <h2 className="text-[11px] font-mono text-cyan-200/90 truncate max-w-xs">
                {fileName}
              </h2>
              {textureUrl && (
                <span className="text-[10px] font-mono text-emerald-400/90 flex items-center space-x-1">
                  <span>·</span>
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="truncate max-w-[180px]">{activeTextureName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center space-x-2">
          {/* Binary Format Selector (EAW_81 vs ALAMO) */}
          <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-sm p-0.5">
            <button
              onClick={() => setExportFormat('EAW_81')}
              className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                exportFormat === 'EAW_81'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={tr(
                lang,
                'Standard 81-byte Petroglyph / Community MTD format',
                'Formato estándar Petroglyph de 81 bytes por registro',
                'Format standard Petroglyph 81 octets par entrée'
              )}
            >
              81-BYTE STD
            </button>
            <button
              onClick={() => setExportFormat('ALAMO')}
              className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                exportFormat === 'ALAMO'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={tr(
                lang,
                'Alamo Engine MTD header format',
                'Formato binario con cabecera MTD Alamo',
                'Format binaire avec en-tête MTD Alamo'
              )}
            >
              ALAMO BIN
            </button>
          </div>

          {/* Workspace Texture Quick Picker */}
          {workspaceTextures.length > 0 && (
            <select
              onChange={(e) => {
                const f = workspaceTextures.find(
                  (wf) => (wf.webkitRelativePath || wf.name) === e.target.value
                );
                if (f) {
                  decodeImageFileToCanvas(f, (canvas) => {
                    setActiveTextureName(f.name);
                    syncMasterCanvasToUrl(canvas);
                  });
                }
                e.target.value = '';
              }}
              className="hidden xl:block bg-slate-950 border border-amber-800/50 text-amber-300 font-mono text-[9px] uppercase tracking-wider py-1.5 px-2 rounded-sm cursor-pointer focus:outline-none focus:border-amber-500 max-w-[160px]"
            >
              <option value="">
                {tr(lang, 'Workspace .TGA...', 'Textura Workspace...', 'Texture Workspace...')}
              </option>
              {workspaceTextures.map((f, idx) => (
                <option key={idx} value={f.webkitRelativePath || f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => textureInputRef.current?.click()}
            className="px-3 py-1.5 border border-amber-500/40 hover:bg-amber-900/20 text-amber-300 hover:text-amber-200 text-[10px] font-bold tracking-wider uppercase transition-all flex items-center space-x-1.5 font-mono rounded-sm cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{t.mtdEditor.loadTexture}</span>
          </button>

          {textureUrl && (
            <button
              onClick={() => handleRequestExport('tga')}
              className="hidden sm:flex px-2.5 py-1.5 border border-cyan-500/40 hover:bg-cyan-900/20 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase transition-all items-center space-x-1 rounded-sm cursor-pointer"
              title={tr(
                lang,
                'Export only the 32-bit uncompressed .TGA texture sheet',
                'Exportar únicamente la hoja de textura .TGA de 32 bits',
                'Exporter uniquement la feuille de texture .TGA 32 bits'
              )}
            >
              <Download className="w-3 h-3" />
              <span>.TGA</span>
            </button>
          )}

          <button
            onClick={() => handleRequestExport('both')}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-mono font-bold tracking-widest uppercase transition-all flex items-center space-x-1.5 rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {t.mtdEditor.saveBtn} (.MTD{textureUrl ? ' + .TGA' : ''})
            </span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 border border-slate-700/60 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all rounded-sm ml-1 flex items-center justify-center cursor-pointer"
            title={t.mtdEditor.closeBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Sub-Toolbar: Search, Filters, View Switcher & Icon Actions */}
      <div className="h-11 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-[7px] w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={t.mtdEditor.searchPlaceholder || 'Search icon...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-amber-500/70 py-1 pl-8 pr-6 rounded-sm text-xs text-slate-200 placeholder-slate-500 font-mono outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Diagnostic / Status Filter Tabs */}
          <div className="hidden md:flex items-center bg-slate-900/80 border border-slate-800 rounded-sm p-0.5">
            {(
              [
                {
                  id: 'all',
                  label: tr(lang, 'All', 'Todos', 'Tous'),
                  count: icons.length,
                },
                {
                  id: 'overlaps',
                  label: tr(lang, 'Overlaps', 'Solapados', 'Collisions'),
                  count: diagnostics.overlapIds.size,
                },
                {
                  id: 'out_of_bounds',
                  label: tr(lang, 'Out of Bounds', 'Fuera de Rango', 'Hors Limites'),
                  count: diagnostics.outOfBoundsIds.size,
                },
                {
                  id: 'alpha',
                  label: 'Alpha',
                  count: icons.filter((i) => i.alpha).length,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id)}
                className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center space-x-1 ${
                  filterMode === f.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[8px] opacity-75">({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right: View Switcher & Add Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* View Mode Selector: Split | Table | Grid */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-sm p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={tr(
                lang,
                'Split View: Icon List + Interactive Atlas Canvas',
                'Vista Dividida: Lista de Iconos + Lienzo Interactivo del Atlas',
                'Vue Scindée : Liste + Canevas Atlas Interactif'
              )}
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">
                {tr(lang, 'Split Atlas', 'Vista Atlas', 'Vue Atlas')}
              </span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={tr(
                lang,
                'Detailed Table View',
                'Vista de Tabla Detallada',
                'Vue Tableau Détaillé'
              )}
            >
              <List className="w-3 h-3" />
              <span className="hidden sm:inline">
                {tr(lang, 'Table', 'Tabla', 'Tableau')}
              </span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center space-x-1 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={tr(
                lang,
                'Visual Icon Gallery Grid',
                'Galería Visual de Iconos',
                "Grille Visuelle d'Icônes"
              )}
            >
              <Grid className="w-3 h-3" />
              <span className="hidden sm:inline">
                {tr(lang, 'Gallery', 'Galería', 'Galerie')}
              </span>
            </button>
          </div>

          {/* Manual Coordinate Entry Button */}
          <button
            onClick={() =>
              setManualEntryModal({
                name: 'I_BUTTON_NEW_UNIT.TGA',
                x: 2,
                y: 2,
                width: 64,
                height: 48,
                alpha: true,
              })
            }
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center space-x-1 transition-colors cursor-pointer"
            title={tr(
              lang,
              'Register manual UV/pixel coordinate entry without uploading an image',
              'Registrar entrada manual de coordenadas sin subir archivo de imagen',
              'Créer une entrée manuelle de coordonnées sans importer d’image'
            )}
          >
            <FilePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">
              {tr(lang, 'Manual Entry', 'Entrada Manual', 'Entrée Manuelle')}
            </span>
          </button>

          {/* Import Image Icon(s) Button (Single or Batch) */}
          <button
            onClick={() => iconInputRef.current?.click()}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center space-x-1.5 transition-colors cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            title={tr(
              lang,
              'Import one or multiple .TGA/.PNG icons and auto-pack into the atlas',
              'Importar uno o varios iconos .TGA/.PNG y empaquetarlos automáticamente en el atlas',
              'Importer une ou plusieurs icônes .TGA/.PNG dans l’atlas'
            )}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>
              {tr(lang, 'Import Icon(s)', 'Importar Icono(s)', 'Importer Icône(s)')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT / CENTER WORKSPACE (Depends on viewMode) */}
        <div className="flex-1 flex overflow-hidden min-w-0">
          {/* 1. TABLE PANEL (Shown in 'table' and 'split' modes) */}
          {(viewMode === 'table' || viewMode === 'split') && (
            <div
              className={`${
                viewMode === 'split'
                  ? 'w-[360px] lg:w-[430px] xl:w-[490px] border-r border-slate-800 shrink-0'
                  : 'flex-1'
              } bg-[#0b0f19] flex flex-col overflow-hidden`}
            >
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold w-10 text-center text-slate-500">
                        #
                      </th>
                      {textureUrl && (
                        <th className="py-2.5 px-2 font-semibold w-12 text-center">
                          {tr(lang, 'Icon', 'Vista', 'Icône')}
                        </th>
                      )}
                      <th
                        onClick={() => toggleSort('name')}
                        className="py-2.5 px-3 font-semibold cursor-pointer hover:text-amber-300 transition-colors"
                      >
                        {t.mtdEditor.editor.idName || 'Icon Name'}{' '}
                        {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('x')}
                        className="py-2.5 px-2.5 font-semibold cursor-pointer hover:text-amber-300"
                      >
                        X {sortField === 'x' ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('y')}
                        className="py-2.5 px-2.5 font-semibold cursor-pointer hover:text-amber-300"
                      >
                        Y {sortField === 'y' ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('width')}
                        className="py-2.5 px-2.5 font-semibold cursor-pointer hover:text-amber-300"
                      >
                        W {sortField === 'width' ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                      <th
                        onClick={() => toggleSort('height')}
                        className="py-2.5 px-2.5 font-semibold cursor-pointer hover:text-amber-300"
                      >
                        H {sortField === 'height' ? (sortAsc ? '↑' : '↓') : ''}
                      </th>
                      {viewMode === 'table' && (
                        <th className="py-2.5 px-3 font-semibold">
                          {tr(lang, 'Status', 'Estado', 'État')}
                        </th>
                      )}
                      <th className="py-2.5 px-3 font-semibold w-16 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {paginatedIcons.map((icon, idx) => {
                      const globalIdx = (safeCurrentPage - 1) * itemsPerPage + idx;
                      const isSelected = selectedId === icon.id;
                      const hasOverlap = diagnostics.overlapIds.has(icon.id);
                      const isOob = diagnostics.outOfBoundsIds.has(icon.id);

                      return (
                        <tr
                          key={icon.id}
                          ref={(el) => {
                            if (el) rowRefs.current[icon.id] = el;
                            else delete rowRefs.current[icon.id];
                          }}
                          onClick={() => setSelectedId(icon.id)}
                          onDoubleClick={() => centerIconInAtlas(icon)}
                          className={`cursor-pointer hover:bg-slate-900/60 transition-colors group ${
                            isSelected
                              ? 'bg-cyan-900/25 shadow-[inset_3px_0_0_#06b6d4]'
                              : isOob
                              ? 'bg-red-950/15'
                              : hasOverlap
                              ? 'bg-orange-950/15'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-600 font-mono text-[10px]">
                            {globalIdx + 1}
                          </td>

                          {/* Live Mini Cropped Thumbnail using shared CSS variable */}
                          {textureUrl && (
                            <td className="py-1.5 px-2 text-center">
                              <div className="w-8 h-7 mx-auto bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-center overflow-hidden">
                                {icon.width > 0 && icon.height > 0 && textureSize ? (
                                  <div
                                    style={{
                                      width: `${icon.width}px`,
                                      height: `${icon.height}px`,
                                      backgroundImage: 'var(--mtd-atlas-url)',
                                      backgroundPosition: `-${icon.x}px -${icon.y}px`,
                                      backgroundSize: `${textureSize.w}px ${textureSize.h}px`,
                                      backgroundRepeat: 'no-repeat',
                                      imageRendering: 'pixelated',
                                      transform: `scale(${Math.min(
                                        28 / icon.width,
                                        24 / icon.height,
                                        1
                                      )})`,
                                      transformOrigin: 'center center',
                                    }}
                                  />
                                ) : (
                                  <span className="text-[8px] text-red-400 font-mono">!</span>
                                )}
                              </div>
                            </td>
                          )}

                          <td
                            className={`py-2 px-3 font-mono font-bold truncate max-w-[170px] xl:max-w-[220px] ${
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            }`}
                            title={icon.name}
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className="truncate">{icon.name}</span>
                              {isOob && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                                  title="Out of bounds"
                                />
                              )}
                              {!isOob && hasOverlap && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"
                                  title="Overlaps another icon"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                            {icon.x}
                          </td>
                          <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                            {icon.y}
                          </td>
                          <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                            {icon.width}
                          </td>
                          <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                            {icon.height}
                          </td>

                          {viewMode === 'table' && (
                            <td className="py-2 px-3 font-mono text-[10px]">
                              {isOob ? (
                                <span className="text-red-400">
                                  {tr(lang, 'Out of bounds', 'Fuera de rango', 'Hors limites')}
                                </span>
                              ) : hasOverlap ? (
                                <span className="text-orange-400">
                                  {tr(lang, 'Overlap', 'Solapado', 'Collision')}
                                </span>
                              ) : (
                                <span className="text-emerald-400/80">
                                  OK {icon.alpha ? '· Alpha' : ''}
                                </span>
                              )}
                            </td>
                          )}

                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateIcon(icon);
                                }}
                                className="p-1 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:text-cyan-300 hover:bg-slate-800 transition-all"
                                title={tr(
                                  lang,
                                  'Duplicate entry',
                                  'Duplicar entrada',
                                  "Dupliquer l'entrée"
                                )}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(icon.id);
                                }}
                                className={`p-1 rounded transition-all ${
                                  isSelected
                                    ? 'text-cyan-400 hover:bg-red-500/20 hover:text-red-300'
                                    : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-slate-800'
                                }`}
                                title={t.mtdEditor.list?.deleteTitle || 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredIcons.length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-mono text-xs">
                    {t.mtdEditor.list.noResults || 'No icons found.'}
                  </div>
                )}
              </div>

              {/* Pagination Footer Bar */}
              {filteredIcons.length > itemsPerPage && (
                <div className="h-9 bg-slate-900/90 border-t border-slate-800 px-3 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span>
                      {(safeCurrentPage - 1) * itemsPerPage + 1}–
                      {Math.min(safeCurrentPage * itemsPerPage, filteredIcons.length)}{' '}
                      {tr(lang, 'of', 'de', 'sur')} {filteredIcons.length}
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded-sm text-[9px] outline-none cursor-pointer"
                    >
                      <option value={50}>50 / pág</option>
                      <option value={100}>100 / pág</option>
                      <option value={250}>250 / pág</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-cyan-300 font-bold">
                      {safeCurrentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. INTERACTIVE ATLAS CANVAS VIEWPORT (Shown in 'split' mode) */}
          {viewMode === 'split' && (
            <div className="flex-1 flex flex-col bg-[#060911] overflow-hidden relative">
              {/* Atlas Viewport Top Overlay Bar */}
              <div className="h-9 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between text-[10px] font-mono z-10 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {tr(
                        lang,
                        'Interactive Atlas Canvas',
                        'Lienzo Interactivo del Atlas',
                        "Canevas d'Atlas Interactif"
                      )}
                    </span>
                  </span>
                  {textureSize && (
                    <span className="text-slate-400">
                      · {textureSize.w}×{textureSize.h}px
                    </span>
                  )}
                </div>

                {/* Zoom & Overlay Controls */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowOverlayBoxes(!showOverlayBoxes)}
                    className={`px-2 py-0.5 rounded-sm border text-[9px] uppercase tracking-wider cursor-pointer flex items-center space-x-1 ${
                      showOverlayBoxes
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                    title={tr(
                      lang,
                      'Toggle icon bounding boxes on atlas',
                      'Mostrar/ocultar recuadros delimitadores sobre el atlas',
                      'Afficher/masquer les cadres sur l’atlas'
                    )}
                  >
                    {showOverlayBoxes ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    <span>{tr(lang, 'Boxes', 'Cajas', 'Cadres')}</span>
                  </button>

                  <button
                    onClick={() => setShowOverlayLabels(!showOverlayLabels)}
                    className={`px-2 py-0.5 rounded-sm border text-[9px] uppercase tracking-wider cursor-pointer ${
                      showOverlayLabels
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                    title={tr(
                      lang,
                      'Show icon names on atlas boxes',
                      'Mostrar nombres de iconos en el atlas',
                      'Afficher les noms sur l’atlas'
                    )}
                  >
                    {tr(lang, 'Names', 'Nombres', 'Noms')}
                  </button>

                  <button
                    onClick={() => setShowPaddingGuides(!showPaddingGuides)}
                    className={`px-2 py-0.5 rounded-sm border text-[9px] uppercase tracking-wider cursor-pointer ${
                      showPaddingGuides
                        ? 'bg-purple-950/80 border-purple-500/50 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                    title={tr(
                      lang,
                      'Show 2px safety padding border around icons',
                      'Mostrar guía de margen seguro de 2px',
                      'Afficher la marge de sécurité de 2px'
                    )}
                  >
                    2px Pad
                  </button>

                  <div className="h-3.5 w-[1px] bg-slate-800 mx-1" />

                  <button
                    onClick={() =>
                      setAtlasZoom((z) => Number(Math.max(0.15, z - 0.25).toFixed(2)))
                    }
                    className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="w-12 text-center text-cyan-300 font-bold">
                    {Math.round(atlasZoom * 100)}%
                  </span>
                  <button
                    onClick={() =>
                      setAtlasZoom((z) => Number(Math.min(4, z + 0.25).toFixed(2)))
                    }
                    className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setAtlasZoom(1);
                      setAtlasPan({ x: 16, y: 16 });
                    }}
                    className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Reset 100%"
                  >
                    1:1
                  </button>
                  {textureSize && (
                    <button
                      onClick={fitAtlasToViewport}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={tr(
                        lang,
                        'Fit to screen',
                        'Ajustar a pantalla',
                        'Ajuster à l’écran'
                      )}
                    >
                      FIT
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Canvas Surface */}
              <div
                ref={atlasViewportRef}
                onWheel={handleAtlasWheel}
                onMouseDown={handleAtlasMouseDown}
                onMouseMove={handleAtlasMouseMove}
                onMouseUp={handleAtlasMouseUp}
                onMouseLeave={handleAtlasMouseUp}
                className={`flex-1 relative overflow-hidden ${
                  isPanning ? 'cursor-grabbing' : 'cursor-grab'
                } bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]`}
              >
                {textureUrl && textureSize ? (
                  <div
                    style={{
                      transform: `translate(${atlasPan.x}px, ${atlasPan.y}px) scale(${atlasZoom})`,
                      transformOrigin: '0 0',
                      width: `${textureSize.w}px`,
                      height: `${textureSize.h}px`,
                    }}
                    className="relative shadow-[0_0_40px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/40 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:16px_16px]"
                  >
                    {/* Base Atlas Sheet Image */}
                    <img
                      src={textureUrl}
                      alt="MegaTexture Atlas"
                      draggable={false}
                      className="w-full h-full block pointer-events-none select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Hardware-Accelerated Bounding Boxes Overlay Canvas */}
                    <canvas
                      ref={overlayCanvasRef}
                      width={textureSize.w}
                      height={textureSize.h}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Single Interactive Resize Handle for the Selected Icon when Unlocked */}
                    {showOverlayBoxes && selectedIcon && coordsEnabled && (
                      <div
                        style={{
                          left: `${
                            draggingIconState?.id === selectedIcon.id
                              ? draggingIconState.curX
                              : selectedIcon.x
                          }px`,
                          top: `${
                            draggingIconState?.id === selectedIcon.id
                              ? draggingIconState.curY
                              : selectedIcon.y
                          }px`,
                          width: `${Math.max(
                            2,
                            draggingIconState?.id === selectedIcon.id
                              ? draggingIconState.curW
                              : selectedIcon.width
                          )}px`,
                          height: `${Math.max(
                            2,
                            draggingIconState?.id === selectedIcon.id
                              ? draggingIconState.curH
                              : selectedIcon.height
                          )}px`,
                        }}
                        className="absolute z-20 cursor-move pointer-events-auto"
                      >
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingIconState({
                              id: selectedIcon.id,
                              mode: 'resize',
                              startX: e.clientX,
                              startY: e.clientY,
                              origX: selectedIcon.x,
                              origY: selectedIcon.y,
                              origW: selectedIcon.width,
                              origH: selectedIcon.height,
                              curX: selectedIcon.x,
                              curY: selectedIcon.y,
                              curW: selectedIcon.width,
                              curH: selectedIcon.height,
                            });
                          }}
                          className="w-3 h-3 bg-amber-400 border border-slate-950 absolute -bottom-1.5 -right-1.5 cursor-nwse-resize z-30"
                          title={tr(
                            lang,
                            'Drag to resize icon width/height',
                            'Arrastra para redimensionar ancho/alto',
                            'Glisser pour redimensionner'
                          )}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty State when no Texture is loaded yet */
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-amber-400/70" />
                    </div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300 mb-1.5">
                      {tr(
                        lang,
                        'MegaTexture Atlas Sheet Not Loaded',
                        'Hoja de Textura del Atlas No Cargada',
                        "Feuille de Texture de l'Atlas Non Chargée"
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
                      {tr(
                        lang,
                        'Load the companion .TGA or .PNG sprite sheet (e.g. Mt_commandbar.tga) to inspect all icon bounding boxes visually, or import new icons directly to generate a fresh power-of-two texture atlas automatically.',
                        'Carga la hoja de textura .TGA o .PNG asociada (ej. Mt_commandbar.tga) para inspeccionar todos los recuadros de iconos sobre el lienzo, o importa nuevos iconos para generar un atlas automáticamente.',
                        'Chargez la feuille de texture .TGA ou .PNG correspondante (ex: Mt_commandbar.tga) pour inspecter visuellement toutes les icônes, ou importez de nouvelles icônes pour générer un atlas automatiquement.'
                      )}
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => textureInputRef.current?.click()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center space-x-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t.mtdEditor.loadTexture}</span>
                      </button>
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer flex items-center space-x-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            lang,
                            'Auto-Generate with Icons',
                            'Generar con Nuevos Iconos',
                            'Générer avec des Icônes'
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Status Pill inside Atlas Viewport */}
                {textureSize && selectedIcon && (
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-sm font-mono text-[10px] text-slate-300 flex items-center space-x-3 pointer-events-none shadow-lg">
                    <span className="text-cyan-400 font-bold">{selectedIcon.name}</span>
                    <span>·</span>
                    <span>
                      X:
                      {draggingIconState?.id === selectedIcon.id
                        ? draggingIconState.curX
                        : selectedIcon.x}{' '}
                      Y:
                      {draggingIconState?.id === selectedIcon.id
                        ? draggingIconState.curY
                        : selectedIcon.y}{' '}
                      (
                      {draggingIconState?.id === selectedIcon.id
                        ? draggingIconState.curW
                        : selectedIcon.width}
                      ×
                      {draggingIconState?.id === selectedIcon.id
                        ? draggingIconState.curH
                        : selectedIcon.height}
                      px)
                    </span>
                    <span>·</span>
                    <span className={coordsEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                      {coordsEnabled
                        ? tr(
                            lang,
                            'Drag box on canvas to move/resize',
                            'Arrastra el recuadro en el lienzo para mover/redimensionar',
                            'Faites glisser le cadre pour déplacer/redimensionner'
                          )
                        : tr(
                            lang,
                            'Unlock coordinates in sidebar to drag on canvas',
                            'Activa Coordenadas en el panel derecho para arrastrar en el lienzo',
                            'Déverrouillez les coordonnées pour déplacer sur le canevas'
                          )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. VISUAL ICON GALLERY GRID VIEW (Shown in 'grid' mode, paginated) */}
          {viewMode === 'grid' && (
            <div className="flex-1 bg-[#080c14] flex flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {paginatedIcons.map((icon) => {
                    const isSelected = icon.id === selectedId;
                    const isOob = diagnostics.outOfBoundsIds.has(icon.id);
                    const hasOverlap = diagnostics.overlapIds.has(icon.id);

                    return (
                      <div
                        key={icon.id}
                        onClick={() => setSelectedId(icon.id)}
                        className={`p-3 rounded-sm border transition-all cursor-pointer flex flex-col items-center text-center group relative ${
                          isSelected
                            ? 'bg-cyan-950/35 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                            : isOob
                            ? 'bg-red-950/20 border-red-800/60 hover:border-red-500'
                            : hasOverlap
                            ? 'bg-orange-950/20 border-orange-800/60 hover:border-orange-500'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900'
                        }`}
                      >
                        <div className="w-full h-20 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:12px_12px] border border-slate-800 rounded-sm flex items-center justify-center overflow-hidden mb-2">
                          {textureUrl && textureSize && icon.width > 0 && icon.height > 0 ? (
                            <div
                              style={{
                                width: `${icon.width}px`,
                                height: `${icon.height}px`,
                                backgroundImage: 'var(--mtd-atlas-url)',
                                backgroundPosition: `-${icon.x}px -${icon.y}px`,
                                backgroundSize: `${textureSize.w}px ${textureSize.h}px`,
                                backgroundRepeat: 'no-repeat',
                                imageRendering: 'pixelated',
                                transform: `scale(${Math.min(
                                  72 / icon.width,
                                  68 / icon.height,
                                  1.5
                                )})`,
                                transformOrigin: 'center center',
                              }}
                            />
                          ) : (
                            <ImageOff className="w-5 h-5 text-slate-600" />
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold truncate w-full ${
                            isSelected ? 'text-cyan-300' : 'text-slate-200'
                          }`}
                          title={icon.name}
                        >
                          {icon.name.replace(/^I_BUTTON_/i, '')}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                          {icon.width}×{icon.height}px · ({icon.x},{icon.y})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredIcons.length > itemsPerPage && (
                <div className="h-9 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
                  <span>
                    {(safeCurrentPage - 1) * itemsPerPage + 1}–
                    {Math.min(safeCurrentPage * itemsPerPage, filteredIcons.length)}{' '}
                    {tr(lang, 'of', 'de', 'sur')} {filteredIcons.length}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-cyan-300 font-bold">
                      {safeCurrentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="p-1 bg-slate-950 hover:bg-slate-800 disabled:opacity-35 border border-slate-800 rounded-sm text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR — Selected Icon Inspector & Operations */}
        <div className="w-full md:w-[330px] lg:w-[370px] xl:w-[400px] bg-slate-950 flex flex-col z-20 shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.3)] border-l border-slate-800">
          <div className="h-10 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-amber-400 font-mono font-bold">
              {t.mtdEditor.editor?.iconProperties || 'Icon Properties'}
            </span>
            {selectedIcon && (
              <div className="flex items-center space-x-1">
                {viewMode === 'split' && textureSize && (
                  <button
                    onClick={() => centerIconInAtlas(selectedIcon)}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[9px] font-mono uppercase rounded-sm cursor-pointer"
                    title={tr(
                      lang,
                      'Locate and center this icon on the Atlas Canvas',
                      'Localizar y centrar este icono en el lienzo del Atlas',
                      "Centrer cette icône sur le canevas de l'Atlas"
                    )}
                  >
                    {tr(lang, 'Center in Atlas', 'Centrar en Atlas', 'Centrer')}
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedIcon ? (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              {/* Cropped Live Icon Preview Box */}
              <div className="h-44 border-b border-slate-800 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:16px_16px] flex flex-col items-center justify-center p-4 relative shrink-0">
                {textureUrl && textureSize ? (
                  (() => {
                    const wPx = selectedIcon.width;
                    const hPx = selectedIcon.height;
                    const xPx = selectedIcon.x;
                    const yPx = selectedIcon.y;
                    const validSize = wPx > 0 && hPx > 0 && wPx <= 8192 && hPx <= 8192;

                    return validSize ? (
                      <div
                        className="shadow-2xl shadow-black ring-1 ring-cyan-500/60 max-w-[180px] max-h-[140px]"
                        style={{
                          width: `${wPx}px`,
                          height: `${hPx}px`,
                          backgroundImage: 'var(--mtd-atlas-url)',
                          backgroundPosition: `-${xPx}px -${yPx}px`,
                          backgroundSize: `${textureSize.w}px ${textureSize.h}px`,
                          backgroundRepeat: 'no-repeat',
                          imageRendering: 'pixelated',
                          transformOrigin: 'center center',
                          transform:
                            wPx > 180 || hPx > 140
                              ? `scale(${Math.min(180 / wPx, 140 / hPx)})`
                              : wPx < 64 && hPx < 64
                              ? 'scale(1.5)'
                              : 'none',
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-red-400 font-mono">
                        {t.mtdEditor.invalidDimensions || 'Invalid dimensions'}
                      </span>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <ImageOff className="w-8 h-8 opacity-40 mb-2" />
                    <span className="text-[10px] font-mono text-slate-500 w-3/4 text-center">
                      {t.mtdEditor.loadTexturePreview || 'Load texture to preview graphic'}
                    </span>
                  </div>
                )}

                {/* Dimension & Alpha Overlay Tag */}
                <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-slate-800 px-2 py-0.5 rounded-sm font-mono text-[9px] text-slate-400">
                  {selectedIcon.width}×{selectedIcon.height}px ·{' '}
                  {selectedIcon.alpha ? 'RGBA' : 'RGB'}
                </div>
              </div>

              {/* Quick Graphic Actions Bar (Replace / Export PNG / Export TGA / Duplicate) */}
              <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-2 gap-2">
                <button
                  onClick={() => replaceIconInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  title={tr(
                    lang,
                    'Replace this icon graphic on the atlas with another .TGA/.PNG image',
                    'Reemplazar la imagen de este icono en el atlas por otro archivo .TGA/.PNG',
                    "Remplacer l'image de cette icône dans l'atlas"
                  )}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {tr(lang, 'Replace Image', 'Cambiar Imagen', 'Remplacer Image')}
                  </span>
                </button>

                <button
                  onClick={() => handleDuplicateIcon(selectedIcon)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>{tr(lang, 'Duplicate', 'Duplicar', 'Dupliquer')}</span>
                </button>

                {textureUrl && (
                  <>
                    <button
                      onClick={() => exportSingleIcon(selectedIcon, 'png')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{tr(lang, 'Export .PNG', 'Extraer .PNG', 'Extraire .PNG')}</span>
                    </button>
                    <button
                      onClick={() => exportSingleIcon(selectedIcon, 'tga')}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>{tr(lang, 'Export .TGA', 'Extraer .TGA', 'Extraire .TGA')}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Diagnostic Repair Notice if Overlapping or Out of Bounds */}
              {(diagnostics.overlapIds.has(selectedIcon.id) ||
                diagnostics.outOfBoundsIds.has(selectedIcon.id)) && (
                <div className="mx-4 mt-3 p-3 bg-orange-950/30 border border-orange-500/40 rounded-sm flex items-center justify-between gap-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] font-mono text-orange-200 leading-relaxed">
                      {diagnostics.outOfBoundsIds.has(selectedIcon.id)
                        ? tr(
                            lang,
                            'Icon exceeds atlas bounds or has 0 size.',
                            'El icono excede los límites del atlas o tiene tamaño 0.',
                            "L'icône dépasse les limites de l'atlas ou a une taille de 0."
                          )
                        : tr(
                            lang,
                            'Icon bounding box overlaps another icon.',
                            'El recuadro de este icono se solapa con otro icono.',
                            'Ce cadre chevauche une autre icône.'
                          )}
                    </div>
                  </div>
                  <button
                    onClick={() => repackSingleIcon(selectedIcon)}
                    className="px-2.5 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 font-mono text-[9px] font-bold uppercase tracking-wider rounded-sm shrink-0 cursor-pointer"
                  >
                    {tr(lang, 'Auto-Fix Slot', 'Auto-Reparar', 'Auto-Réparer')}
                  </button>
                </div>
              )}

              {/* Form Editor */}
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[9px] uppercase tracking-widest text-cyan-400 font-bold font-mono">
                      {t.mtdEditor.editor.idName || 'Icon Name'}
                    </label>
                    <button
                      onClick={() =>
                        handleUpdate(selectedIcon.id, {
                          name: formatEawIconName(selectedIcon.name),
                        })
                      }
                      className="text-[9px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      title={tr(
                        lang,
                        'Format as I_BUTTON_*.TGA',
                        'Formatear como I_BUTTON_*.TGA',
                        'Formater en I_BUTTON_*.TGA'
                      )}
                    >
                      I_BUTTON_*.TGA
                    </button>
                  </div>
                  <input
                    type="text"
                    value={selectedIcon.name}
                    onChange={(e) =>
                      handleUpdate(selectedIcon.id, { name: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-sm p-2 text-xs font-mono text-cyan-100 outline-none transition-colors shadow-inner"
                  />
                </div>

                {/* Alpha Channel Flag */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-900/50 border border-slate-800 rounded-sm">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-300 uppercase block">
                      {tr(
                        lang,
                        'Alpha Channel Transparency',
                        'Canal Alfa (Transparencia)',
                        'Canal Alpha (Transparence)'
                      )}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {tr(
                        lang,
                        'Byte 80 flag in .MTD binary entry',
                        'Bandera del byte 80 en el registro binario .MTD',
                        'Drapeau octet 80 dans le binaire .MTD'
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleUpdate(selectedIcon.id, { alpha: !selectedIcon.alpha })
                    }
                    className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                      selectedIcon.alpha
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-700 text-slate-500'
                    }`}
                  >
                    {selectedIcon.alpha ? 'ALPHA ON (1)' : 'OPAQUE (0)'}
                  </button>
                </div>

                {/* Pixel Coordinates Section */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold font-mono flex items-center space-x-1.5">
                      <Move className="w-3 h-3 text-cyan-400" />
                      <span>{t.mtdEditor.editor.boundsInfo || 'Pixel Coordinates'}</span>
                    </label>
                    <button
                      onClick={() => setCoordsEnabled(!coordsEnabled)}
                      className={`px-2 py-1 flex items-center space-x-1.5 border rounded-sm text-[9px] font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                        coordsEnabled
                          ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          coordsEnabled ? 'bg-cyan-400' : 'bg-slate-600'
                        }`}
                      />
                      <span>
                        {coordsEnabled
                          ? tr(lang, 'Unlocked', 'Desbloqueado', 'Déverrouillé')
                          : tr(lang, 'Locked', 'Bloqueado', 'Verrouillé')}
                      </span>
                    </button>
                  </div>

                  <div
                    className={`grid grid-cols-2 gap-3 transition-opacity ${
                      coordsEnabled ? '' : 'opacity-45 pointer-events-none'
                    }`}
                  >
                    {(['x', 'y', 'width', 'height'] as const).map((key) => {
                      const val = selectedIcon[key];
                      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        let num = parseInt(e.target.value, 10);
                        if (isNaN(num)) num = 0;
                        handleUpdate(selectedIcon.id, { [key]: num });
                      };

                      return (
                        <div key={key}>
                          <label className="block text-[9px] uppercase tracking-widest text-slate-500 font-mono mb-1">
                            {key === 'width'
                              ? `${t.mtdEditor.editor.width || 'Width'} (W)`
                              : key === 'height'
                              ? `${t.mtdEditor.editor.height || 'Height'} (H)`
                              : `${key.toUpperCase()} (px)`}
                          </label>
                          <input
                            type="number"
                            step={1}
                            value={Math.round(val)}
                            onChange={handleChange}
                            className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-sm p-1.5 pl-2.5 text-xs font-mono text-slate-200 outline-none shadow-inner"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expert UV Coords */}
                <div className="p-3 bg-indigo-950/25 border border-indigo-500/30 rounded-sm">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-300 tracking-widest uppercase font-mono">
                      {t.mtdEditor.expertUv || 'Expert: UV Coords'}
                    </span>
                    <Maximize className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  {textureSize ? (
                    <div className="grid grid-cols-2 gap-2 text-indigo-200/70 font-mono text-[10px]">
                      <div>
                        U0 (Left):
                        <br />
                        <span className="text-indigo-100 font-bold">
                          {(selectedIcon.x / textureSize.w).toFixed(6)}
                        </span>
                      </div>
                      <div>
                        V0 (Top):
                        <br />
                        <span className="text-indigo-100 font-bold">
                          {(selectedIcon.y / textureSize.h).toFixed(6)}
                        </span>
                      </div>
                      <div>
                        U1 (Right):
                        <br />
                        <span className="text-indigo-100 font-bold">
                          {((selectedIcon.x + selectedIcon.width) / textureSize.w).toFixed(
                            6
                          )}
                        </span>
                      </div>
                      <div>
                        V1 (Bottom):
                        <br />
                        <span className="text-indigo-100 font-bold">
                          {((selectedIcon.y + selectedIcon.height) / textureSize.h).toFixed(
                            6
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-indigo-300/60 leading-relaxed font-mono">
                      {t.mtdEditor.loadTextureAtlas ||
                        'Load a texture atlas to view the calculated UV float mapping (0.0 - 1.0).'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-[10px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
                {t.mtdEditor.noIconSelected || 'No Icon Selected'}
              </span>
              <div className="w-12 h-12 border-2 border-dashed border-slate-800 rounded-sm mb-3" />
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Pending Single or Batch Icon Upload */}
      {pendingUploads.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 font-sans backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-sm shadow-2xl p-6 max-w-lg w-full relative">
            <button
              onClick={() => setPendingUploads([])}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-slate-100 text-sm font-bold font-mono tracking-widest uppercase">
                {pendingUploads.length === 1
                  ? t.mtdEditor.nameNewIcon || 'Import & Pack New Icon'
                  : tr(
                      lang,
                      `Batch Import & Auto-Pack (${pendingUploads.length} Icons)`,
                      `Importación y Empaquetado por Lotes (${pendingUploads.length} Iconos)`,
                      `Importation en Lot (${pendingUploads.length} Icônes)`
                    )}
              </h3>
            </div>

            <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2.5 mb-5 pr-1">
              {pendingUploads.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-2.5 rounded-sm flex items-center space-x-3"
                >
                  <div className="w-12 h-12 bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)] bg-[length:10px_10px] border border-slate-800 rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[9px] uppercase tracking-widest text-cyan-400 font-bold font-mono mb-1">
                      {t.mtdEditor.editor.idName || 'Icon Name'} #{idx + 1} ({item.w}×
                      {item.h}px · {item.hasAlpha ? 'Alpha' : 'Opaque'})
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setPendingUploads((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, name: val } : p))
                        );
                      }}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-sm px-2.5 py-1.5 text-xs font-mono text-cyan-100 outline-none uppercase"
                      autoFocus={idx === 0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmPendingUploads();
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-4 bg-slate-950/60 p-2.5 border border-slate-800 rounded-sm">
              <span>
                {tr(
                  lang,
                  'Auto-packer enforces a 2px transparent border around each icon to prevent Alamo UV bleeding.',
                  'El empaquetador automático aplica un margen de seguridad de 2px alrededor de cada icono para evitar sangrado UV.',
                  "L'empaqueteur applique une marge de sécurité de 2px autour de chaque icône."
                )}
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingUploads([])}
                className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-sm font-mono text-[11px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
              >
                {t.mtdEditor.cancelBtn || 'Cancel'}
              </button>
              <button
                onClick={confirmPendingUploads}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-sm font-mono text-[11px] uppercase tracking-wider font-bold shadow-lg transition-all cursor-pointer"
              >
                {t.mtdEditor.addIconBtn || 'Add Icon'} ({pendingUploads.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Manual Entry Creation */}
      {manualEntryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 font-sans backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-sm shadow-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setManualEntryModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-cyan-300 text-sm font-bold mb-4 font-mono tracking-widest uppercase">
              {tr(
                lang,
                'Register Manual Atlas Entry',
                'Registrar Entrada Manual en el Atlas',
                "Nouvelle Entrée Manuelle dans l'Atlas"
              )}
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-cyan-400 font-bold font-mono mb-1">
                  {t.mtdEditor.editor.idName || 'Icon Name'}
                </label>
                <input
                  type="text"
                  value={manualEntryModal.name}
                  onChange={(e) =>
                    setManualEntryModal({
                      ...manualEntryModal,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-sm p-2 text-xs font-mono text-cyan-100 outline-none uppercase"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(['x', 'y', 'width', 'height'] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-[9px] uppercase tracking-widest text-slate-400 font-mono mb-1">
                      {k.toUpperCase()} (px)
                    </label>
                    <input
                      type="number"
                      value={manualEntryModal[k]}
                      onChange={(e) =>
                        setManualEntryModal({
                          ...manualEntryModal,
                          [k]: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-sm p-1.5 text-xs font-mono text-slate-200 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setManualEntryModal(null)}
                className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-sm font-mono text-[11px] uppercase tracking-wider cursor-pointer"
              >
                {t.mtdEditor.cancelBtn || 'Cancel'}
              </button>
              <button
                onClick={handleCreateManualEntry}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider cursor-pointer"
              >
                {t.mtdEditor.addIconBtn || 'Add Icon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tactical HUD Diagnostic Warning Modal (Replaces window.confirm) */}
      {saveWarningModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 font-sans backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/50 rounded-sm shadow-2xl p-6 max-w-md w-full relative">
            <div className="flex items-center space-x-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-amber-300 text-xs font-bold font-mono tracking-widest uppercase">
                {saveWarningModal.title}
              </h3>
            </div>

            <div className="space-y-2 mb-5">
              {saveWarningModal.messages.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-amber-900/50 rounded-sm text-xs text-slate-300 font-mono leading-relaxed"
                >
                  • {m}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setSaveWarningModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm font-mono text-[10px] uppercase tracking-wider font-bold cursor-pointer"
              >
                {tr(lang, 'Cancel & Inspect', 'Cancelar y Revisar', 'Annuler & Vérifier')}
              </button>
              <button
                onClick={() => executeExport(saveWarningModal.exportMode)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-sm font-mono text-[10px] uppercase tracking-wider font-bold cursor-pointer"
              >
                {tr(lang, 'Export Anyway', 'Exportar Igualmente', 'Exporter Quand Même')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
