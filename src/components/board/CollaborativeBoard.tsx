/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLMS } from '../../context/LMSContext';
import { ToolType, VectorPoint, VectorStroke, BoardSlideContent } from '../../types/lms';
import { 
  Pen, 
  Highlighter, 
  Eraser, 
  Square, 
  Circle, 
  ArrowRight, 
  Minus, 
  Type, 
  StickyNote, 
  Zap, 
  RotateCcw, 
  Trash2, 
  Eye, 
  Users, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileText,
  HardDrive,
  Cloud,
  FolderOpen,
  ArrowRightLeft,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PDFUploadStorageModal } from './PDFUploadStorageModal';
import { PDFLibraryDrawer } from './PDFLibraryDrawer';
import { renderPdfPageToCanvas } from '../../utils/pdfRenderer';
import { formatBytes } from '../../utils/pdfStorageService';

const PALETTE = [
  '#0f172a', // Slate black
  '#2563eb', // Royal Blue
  '#dc2626', // Crimson Red
  '#16a34a', // Emerald Green
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#ec4899', // Pink
];

export const CollaborativeBoard: React.FC = () => {
  const { 
    currentUser, 
    selectedLecture, 
    activePageIndex, 
    setActivePageIndex,
    strokes, 
    addStroke, 
    undoLastStroke, 
    clearCurrentPage,
    activeTool, 
    setActiveTool,
    strokeColor, 
    setStrokeColor,
    strokeWidth, 
    setStrokeWidth,
    isFollowLeaderActive,
    toggleFollowLeader,
    leaderViewport,
    updateLeaderViewport,
    connectedCollaborators,
    visibleBatches,
    selectedBatchId,
    uploadedPdfs,
    activePdfRecord,
    activePdfBytes,
    isPdfLoading,
    pdfUploadModalOpen,
    openPdfUploadModal,
    closePdfUploadModal,
    preselectedPdfFile,
    pdfNotice,
    dismissPdfNotice,
    uploadPdfWithStorageChoice,
    openPdfOnBoard,
    closeActivePdf,
    migratePdfStorage,
    deleteUploadedPdf,
    savePdfCopyToDisk
  } = useLMS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport transforms (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<VectorPoint[]>([]);
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number; time: number }[]>([]);

  // Text / Sticky Note Input Modal
  const [textModalPos, setTextModalPos] = useState<{ x: number; y: number } | null>(null);
  const [textInputVal, setTextInputVal] = useState('');
  const [isStickyMode, setIsStickyMode] = useState(false);

  // PDF Library Drawer & Board Drag-Drop state
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRenderingPdfPage, setIsRenderingPdfPage] = useState(false);
  const [isStageDragOver, setIsStageDragOver] = useState(false);
  const [isMigratingActive, setIsMigratingActive] = useState(false);

  const activeBatch = visibleBatches.find(b => b.id === selectedBatchId) || visibleBatches[0];

  // Active slide content
  const pages: BoardSlideContent[] = selectedLecture?.slidesPages || [
    {
      pageNumber: 1,
      title: 'Vector Collaborative Board',
      subtitle: 'Real-time Canvas Engine with Operational Transformation',
      keyConcepts: ['High-throughput vector layer', 'Follow-leader broadcast', 'Multi-page synchronizer']
    }
  ];
  const currentPage = pages[activePageIndex] || pages[0];
  const effectiveTotalPages = activePdfRecord ? activePdfRecord.pageCount : pages.length;

  // Render active PDF page via PDF.js whenever the PDF bytes or active page changes
  useEffect(() => {
    if (!activePdfBytes || !pdfCanvasRef.current) return;
    let cancelled = false;
    setIsRenderingPdfPage(true);

    renderPdfPageToCanvas(activePdfBytes, activePageIndex + 1, pdfCanvasRef.current, 940, 580)
      .catch(err => {
        console.error('PDF page render failed:', err);
      })
      .finally(() => {
        if (!cancelled) setIsRenderingPdfPage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePdfBytes, activePageIndex]);

  // Follow Leader Sync: If user is student and follow leader is active, mirror leader's zoom/pan/page
  useEffect(() => {
    if (isFollowLeaderActive && currentUser.role === 'student') {
      setZoom(leaderViewport.zoom);
      setPanOffset({ x: leaderViewport.panX, y: leaderViewport.panY });
      if (activePageIndex !== leaderViewport.pageIndex) {
        setActivePageIndex(leaderViewport.pageIndex);
      }
    }
  }, [isFollowLeaderActive, leaderViewport, currentUser.role, activePageIndex, setActivePageIndex]);

  // Sync leader viewport if current user is instructor and moves zoom/pan
  const notifyLeaderViewport = useCallback((newZoom: number, newPan: { x: number; y: number }, newPage: number) => {
    if (currentUser.role === 'instructor') {
      updateLeaderViewport({
        zoom: newZoom,
        panX: newPan.x,
        panY: newPan.y,
        pageIndex: newPage
      });
    }
  }, [currentUser.role, updateLeaderViewport]);

  // Canvas resize and render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply Zoom & Pan
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Render strokes belonging to current page
    const pageStrokes = strokes.filter(s => s.pageIndex === activePageIndex);

    for (const stroke of pageStrokes) {
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = stroke.width * 3.5;
      } else {
        ctx.globalAlpha = stroke.opacity;
      }

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
        if (stroke.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            // Smooth curve interpolation
            const midX = (stroke.points[i - 1].x + stroke.points[i].x) / 2;
            const midY = (stroke.points[i - 1].y + stroke.points[i].y) / 2;
            ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, midX, midY);
          }
          ctx.stroke();
        }
      } else if (stroke.tool === 'rect') {
        if (stroke.points.length >= 2) {
          const p1 = stroke.points[0];
          const p2 = stroke.points[stroke.points.length - 1];
          const rx = Math.min(p1.x, p2.x);
          const ry = Math.min(p1.y, p2.y);
          const rw = Math.abs(p2.x - p1.x);
          const rh = Math.abs(p2.y - p1.y);
          ctx.strokeRect(rx, ry, rw, rh);
        }
      } else if (stroke.tool === 'circle') {
        if (stroke.points.length >= 2) {
          const p1 = stroke.points[0];
          const p2 = stroke.points[stroke.points.length - 1];
          const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (stroke.tool === 'arrow') {
        if (stroke.points.length >= 2) {
          const p1 = stroke.points[0];
          const p2 = stroke.points[stroke.points.length - 1];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const headLength = 14;
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - headLength * Math.cos(angle - Math.PI / 6), p2.y - headLength * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(p2.x - headLength * Math.cos(angle + Math.PI / 6), p2.y - headLength * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      } else if (stroke.tool === 'line') {
        if (stroke.points.length >= 2) {
          const p1 = stroke.points[0];
          const p2 = stroke.points[stroke.points.length - 1];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else if (stroke.tool === 'text' && stroke.text) {
        if (stroke.points.length >= 1) {
          ctx.font = '600 15px Plus Jakarta Sans, sans-serif';
          ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
        }
      } else if (stroke.tool === 'sticky' && stroke.text) {
        if (stroke.points.length >= 1) {
          const p = stroke.points[0];
          const pad = 12;
          ctx.fillStyle = '#fef08a'; // soft yellow sticky
          ctx.shadowColor = 'rgba(0,0,0,0.12)';
          ctx.shadowBlur = 8;
          ctx.fillRect(p.x, p.y, 160, 90);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1;
          ctx.strokeRect(p.x, p.y, 160, 90);

          ctx.fillStyle = '#1e293b';
          ctx.font = '500 12px Plus Jakarta Sans, sans-serif';
          // simple line wrapping
          const words = stroke.text.split(' ');
          let line = '';
          let lineY = p.y + 22;
          for (let w of words) {
            if ((line + w).length > 20) {
              ctx.fillText(line, p.x + pad, lineY);
              line = w + ' ';
              lineY += 16;
            } else {
              line += w + ' ';
            }
          }
          ctx.fillText(line, p.x + pad, lineY);
        }
      }
      ctx.restore();
    }

    // Render active drawing stroke (in-progress)
    if (isDrawing && currentPoints.length > 0) {
      ctx.save();
      ctx.strokeStyle = activeTool === 'highlighter' ? strokeColor : activeTool === 'eraser' ? '#f8fafc' : strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = activeTool === 'highlighter' ? strokeWidth * 3.5 : strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1;

      if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
        if (currentPoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
          for (let i = 1; i < currentPoints.length; i++) {
            ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
          }
          ctx.stroke();
        }
      } else if (activeTool === 'rect' && currentPoints.length >= 2) {
        const p1 = currentPoints[0];
        const p2 = currentPoints[currentPoints.length - 1];
        ctx.strokeRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
      } else if (activeTool === 'circle' && currentPoints.length >= 2) {
        const p1 = currentPoints[0];
        const p2 = currentPoints[currentPoints.length - 1];
        const rad = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, rad, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === 'arrow' && currentPoints.length >= 2) {
        const p1 = currentPoints[0];
        const p2 = currentPoints[currentPoints.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render laser pointer trail
    if (laserTrail.length > 1) {
      ctx.save();
      const now = Date.now();
      for (let i = 1; i < laserTrail.length; i++) {
        const age = now - laserTrail[i].time;
        if (age < 1500) {
          const alpha = 1 - age / 1500;
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.lineWidth = 4 * alpha;
          ctx.beginPath();
          ctx.moveTo(laserTrail[i - 1].x, laserTrail[i - 1].y);
          ctx.lineTo(laserTrail[i].x, laserTrail[i].y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  }, [
    activePageIndex, 
    strokes, 
    zoom, 
    panOffset, 
    isDrawing, 
    currentPoints, 
    activeTool, 
    strokeColor, 
    strokeWidth, 
    laserTrail
  ]);

  // Request Animation Frame loop for 60 FPS guarantee
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderCanvas]);

  // Mouse Coordinate translation
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): VectorPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // inverse zoom and pan
    return {
      x: (rawX - panOffset.x) / zoom,
      y: (rawY - panOffset.y) / zoom
    };
  };

  // Mouse Events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle button or Alt key or select tool for panning
    if (e.button === 1 || e.altKey || activeTool === 'select') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    const coords = getCanvasCoords(e);

    if (activeTool === 'text' || activeTool === 'sticky') {
      setTextModalPos(coords);
      setIsStickyMode(activeTool === 'sticky');
      return;
    }

    if (activeTool === 'laser') {
      setLaserTrail([{ ...coords, time: Date.now() }]);
      setIsDrawing(true);
      return;
    }

    setIsDrawing(true);
    setCurrentPoints([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const newPan = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
      setPanOffset(newPan);
      notifyLeaderViewport(zoom, newPan, activePageIndex);
      return;
    }

    const coords = getCanvasCoords(e);

    if (activeTool === 'laser' && isDrawing) {
      setLaserTrail(prev => [...prev.slice(-30), { ...coords, time: Date.now() }]);
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      setCurrentPoints(prev => [...prev, coords]);
    } else {
      // Shape tools: start point + current cursor point
      setCurrentPoints(prev => [prev[0], coords]);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (activeTool === 'laser') {
      setIsDrawing(false);
      return;
    }

    if (isDrawing && currentPoints.length > 0) {
      if (activeTool === 'eraser') {
        // Eraser hit test: remove strokes that intersect with eraser path
        const eraserPoints = currentPoints;
        // In this implementation, eraser can either draw background or remove stroke
        addStroke({
          pageIndex: activePageIndex,
          tool: 'pen',
          points: eraserPoints,
          color: '#ffffff',
          width: strokeWidth * 4,
          opacity: 1
        });
      } else {
        addStroke({
          pageIndex: activePageIndex,
          tool: activeTool,
          points: currentPoints,
          color: strokeColor,
          width: strokeWidth,
          opacity: 1
        });
      }
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  // Text / Sticky Submit
  const handleSaveTextNote = () => {
    if (textModalPos && textInputVal.trim()) {
      addStroke({
        pageIndex: activePageIndex,
        tool: isStickyMode ? 'sticky' : 'text',
        points: [textModalPos],
        color: strokeColor,
        width: strokeWidth,
        opacity: 1,
        text: textInputVal.trim()
      });
      setTextInputVal('');
      setTextModalPos(null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    const nextZoom = Math.min(2.5, zoom + 0.15);
    setZoom(nextZoom);
    notifyLeaderViewport(nextZoom, panOffset, activePageIndex);
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(0.5, zoom - 0.15);
    setZoom(nextZoom);
    notifyLeaderViewport(nextZoom, panOffset, activePageIndex);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    notifyLeaderViewport(1, { x: 0, y: 0 }, activePageIndex);
  };

  // Page switcher
  const handlePageChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < effectiveTotalPages) {
      setActivePageIndex(newIndex);
      notifyLeaderViewport(zoom, panOffset, newIndex);
    }
  };

  // Export board as JSON
  const handleExportJSON = () => {
    const boardData = {
      lectureId: selectedLecture?.id,
      lectureTitle: activePdfRecord?.name || selectedLecture?.title,
      storageDestination: activePdfRecord?.storageDestination || 'lecture-slides',
      exportedAt: new Date().toISOString(),
      strokes
    };
    const blob = new Blob([JSON.stringify(boardData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activePdfRecord?.name || selectedLecture?.title || 'Board').replace(/\s+/g, '_')}_Vector_Board.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Drag-and-drop a PDF onto the board opens the Disk vs. Cloud Storage modal
  const handleStageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsStageDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      openPdfUploadModal(file);
    }
  };

  const handleToggleActivePdfStorage = async () => {
    if (!activePdfRecord || isMigratingActive) return;
    setIsMigratingActive(true);
    try {
      const nextDest = activePdfRecord.storageDestination === 'cloud' ? 'disk' : 'cloud';
      await migratePdfStorage(activePdfRecord, nextDest);
    } finally {
      setIsMigratingActive(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] bg-slate-100 overflow-hidden relative">
      {/* Top Board Toolbar */}
      <div className="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4 z-20 shrink-0">
        {/* Left: Tool Selection */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'pen' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Pen Tool (P)"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'highlighter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Highlighter (H)"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'eraser' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Eraser (E)"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => setActiveTool('rect')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'rect' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'circle' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('arrow')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'arrow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Arrow"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'line' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('text')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Text Tool"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('sticky')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'sticky' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Sticky Note"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('laser')}
            className={`p-1.5 rounded-md transition-colors ${
              activeTool === 'laser' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Laser Pointer (Temporary Trail)"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Color & Stroke Width */}
        <div className="flex items-center gap-3">
          {/* Palette */}
          <div className="flex items-center gap-1.5">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  strokeColor === c ? 'scale-125 ring-2 ring-slate-400 ring-offset-1' : 'hover:scale-110'
                }`}
                title={`Color: ${c}`}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Stroke Width Slider */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-mono tabular-nums w-4 text-center">{strokeWidth}px</span>
            <input
              type="range"
              min="1"
              max="12"
              value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-slate-900 cursor-pointer"
              title="Stroke Width"
            />
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Undo & Clear */}
          <button
            onClick={undoLastStroke}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={clearCurrentPage}
            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Clear Page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Follow Leader & Zoom & Export */}
        <div className="flex items-center gap-3">
          {/* Follow Leader Toggle (FR-3.5) */}
          <button
            onClick={toggleFollowLeader}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
              isFollowLeaderActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Broadcast or Follow viewport zoom, pan & page state"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isFollowLeaderActive ? 'Follow Leader: ON' : 'Follow Leader: OFF'}</span>
          </button>

          {/* Zoom buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs font-mono">
            <button
              onClick={handleZoomOut}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 text-slate-600 hover:text-slate-900 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export JSON / Snapshot */}
          <button
            onClick={handleExportJSON}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Export Vector Board JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200" />

          {/* PDF Library Drawer Button */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
            title="View Disk & Cloud Uploaded PDFs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>PDFs</span>
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              ({uploadedPdfs.length})
            </span>
          </button>

          {/* Upload PDF with Disk vs. Cloud Choice */}
          <button
            onClick={() => openPdfUploadModal(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            title="Upload PDF and choose Save on Disk or Store on Cloud"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Active Uploaded PDF Context Bar (Storage Destination & Quick Actions) */}
      {activePdfRecord && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4 text-xs z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {activePdfRecord.storageDestination === 'cloud' ? (
              <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="font-semibold text-slate-900 truncate">{activePdfRecord.name}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 font-medium shrink-0">
              {activePdfRecord.storageDestination === 'cloud'
                ? 'Stored on Cloud (60-min Signed URL)'
                : 'Saved on Local Disk'}
            </span>
            <span className="text-slate-300 hidden md:inline">·</span>
            <span className="text-slate-500 font-mono tabular-nums hidden md:inline">
              {formatBytes(activePdfRecord.sizeBytes)} · {activePdfRecord.pageCount} pages
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => savePdfCopyToDisk(activePdfRecord)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Save to Disk</span>
            </button>
            <button
              disabled={isMigratingActive}
              onClick={handleToggleActivePdfStorage}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-md inline-flex items-center gap-1 disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>
                {activePdfRecord.storageDestination === 'cloud' ? 'Move to Disk' : 'Move to Cloud'}
              </span>
            </button>
            <button
              onClick={closeActivePdf}
              className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md inline-flex items-center gap-1"
              title="Close PDF and return to Lecture Slides"
            >
              <X className="w-3.5 h-3.5" />
              <span>Slides</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Vector Stage Area */}
      <div 
        ref={containerRef}
        onDragOver={e => {
          e.preventDefault();
          if (!isStageDragOver) setIsStageDragOver(true);
        }}
        onDragLeave={() => setIsStageDragOver(false)}
        onDrop={handleStageDrop}
        className="flex-1 relative overflow-hidden flex items-center justify-center p-4"
      >
        {/* Drag-and-Drop Overlay Prompt */}
        {isStageDragOver && (
          <div className="absolute inset-4 z-40 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-50/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload className="w-8 h-8 text-indigo-600" />
            <p className="text-sm font-semibold text-indigo-950">
              Drop PDF to choose Save on Disk or Store on Cloud
            </p>
          </div>
        )}

        {/* Transient Upload / Migration Notice */}
        {pdfNotice && (
          <div className="absolute top-4 right-4 z-40 max-w-md bg-white border border-slate-200 shadow-lg rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 text-xs">
            {pdfNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <span className="text-slate-700 leading-snug">{pdfNotice.message}</span>
            <button
              onClick={dismissPdfNotice}
              className="text-slate-400 hover:text-slate-700 ml-1 shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive PDF Slide Card / Canvas Stage */}
        <div 
          className="relative bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden select-none"
          style={{
            width: '940px',
            height: '580px',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Background Layer: Either Real Uploaded PDF rendered via PDF.js OR Lecture Slide Deck */}
          {activePdfRecord && activePdfBytes ? (
            <div className="absolute inset-0 bg-slate-50 flex items-center justify-center pointer-events-none">
              <canvas ref={pdfCanvasRef} className="shadow-xs bg-white" />
              {(isRenderingPdfPage || isPdfLoading) && (
                <div className="absolute inset-0 bg-white/75 flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Rendering PDF page {activePageIndex + 1}...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none bg-radial from-slate-50 to-white">
              {/* Slide Header */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono uppercase font-semibold text-indigo-600">
                    {selectedLecture?.title || 'Distributed Systems'}
                  </span>
                  <span className="font-mono tabular-nums">
                    Slide {activePageIndex + 1} of {pages.length}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-wrap-balance">
                  {currentPage.title}
                </h2>
                {currentPage.subtitle && (
                  <p className="text-sm text-slate-500 mt-1">{currentPage.subtitle}</p>
                )}
              </div>

              {/* Slide Body: Concepts, Architecture, or Code */}
              <div className="my-auto space-y-4 max-w-2xl">
                {currentPage.keyConcepts && (
                  <div className="space-y-2">
                    {currentPage.keyConcepts.map((concept, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span>{concept}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentPage.codeSnippet && (
                  <div className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 shadow-inner overflow-x-auto">
                    <pre>{currentPage.codeSnippet}</pre>
                  </div>
                )}

                {currentPage.notes && (
                  <div className="text-[11px] text-slate-400 italic">
                    Note: {currentPage.notes}
                  </div>
                )}
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                <span>VectorLMS Interactive Vector Stage</span>
                <span className="font-mono">Lecture_01_Slides.pdf · Drop any PDF to upload</span>
              </div>
            </div>
          )}

          {/* HTML5 Vector Canvas Layer */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-crosshair z-10"
          />

          {/* Real-Time Collaborator Cursors Overlay */}
          {connectedCollaborators.map(c => {
            if (c.id === currentUser.id) return null;
            return (
              <div
                key={c.id}
                className="absolute pointer-events-none z-30 transition-all duration-300 ease-out"
                style={{
                  left: `${c.x}px`,
                  top: `${c.y}px`
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={c.color} className="drop-shadow-md">
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
                <div 
                  className="px-1.5 py-0.5 text-[10px] font-semibold text-white rounded shadow-sm whitespace-nowrap mt-0.5"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name} {c.role === 'instructor' ? '(Leader)' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Text Note Input Popover */}
        {textModalPos && (
          <div 
            className="absolute z-40 bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-64 space-y-2 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${panOffset.x + textModalPos.x * zoom}px`,
              top: `${panOffset.y + textModalPos.y * zoom}px`
            }}
          >
            <p className="text-xs font-semibold text-slate-800">
              {isStickyMode ? 'Add Sticky Note' : 'Add Vector Text'}
            </p>
            <textarea
              autoFocus
              rows={2}
              value={textInputVal}
              onChange={e => setTextInputVal(e.target.value)}
              placeholder="Type annotation..."
              className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveTextNote();
                }
              }}
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setTextModalPos(null)}
                className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTextNote}
                className="px-2.5 py-0.5 text-xs bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Place
              </button>
            </div>
          </div>
        )}

        {/* Live Follow Leader Banner (When active for student) */}
        {isFollowLeaderActive && currentUser.role === 'student' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 shadow-lg border border-slate-700 pointer-events-none z-30">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Following Leader (Prof. Sarah Sterling) · Viewport Synced</span>
          </div>
        )}

        {/* Bottom Page Navigation Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-3 z-30">
          <button
            disabled={activePageIndex === 0}
            onClick={() => handlePageChange(activePageIndex - 1)}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 rounded"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-700 font-mono tabular-nums">
            Page {activePageIndex + 1} / {effectiveTotalPages}
          </span>
          <button
            disabled={activePageIndex >= effectiveTotalPages - 1}
            onClick={() => handlePageChange(activePageIndex + 1)}
            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 rounded"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Right Participants & Active Document Summary */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] text-slate-600 shadow-xs flex items-center gap-2.5 z-30">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-mono tabular-nums">{connectedCollaborators.length}</span>
            <span>Online</span>
          </div>
          {activePdfRecord && (
            <>
              <span className="text-slate-300">·</span>
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>
                  {activePdfRecord.storageDestination === 'cloud' ? 'Cloud' : 'Local Disk'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-Upload Storage Choice Modal (Save on Disk vs. Store on Cloud) */}
      <PDFUploadStorageModal
        isOpen={pdfUploadModalOpen}
        preselectedFile={preselectedPdfFile}
        activeBatchName={activeBatch ? `${activeBatch.code} · ${activeBatch.name}` : 'Active Batch'}
        onClose={closePdfUploadModal}
        onConfirmUpload={async params => {
          await uploadPdfWithStorageChoice(params);
        }}
      />

      {/* Uploaded PDF Library Drawer */}
      <PDFLibraryDrawer
        isOpen={isLibraryOpen}
        pdfs={uploadedPdfs}
        activePdfId={activePdfRecord?.id || null}
        onClose={() => setIsLibraryOpen(false)}
        onUploadNew={() => openPdfUploadModal(null)}
        onOpenOnBoard={record => {
          openPdfOnBoard(record);
        }}
        onSaveToDisk={record => {
          savePdfCopyToDisk(record);
        }}
        onMigrateStorage={migratePdfStorage}
        onDelete={deleteUploadedPdf}
      />
    </div>
  );
};
