'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const IMAGE_CONFIG = {
  TARGET_WIDTH: 596,
  TARGET_HEIGHT: 832,
};

const CONTAINER_CONFIG = {
  WIDTH: 322,
  HEIGHT: 450,
};

// 计算初始缩放，让图片刚好填满容器
const INITIAL_ZOOM = Math.min(
  CONTAINER_CONFIG.WIDTH / IMAGE_CONFIG.TARGET_WIDTH,
  CONTAINER_CONFIG.HEIGHT / IMAGE_CONFIG.TARGET_HEIGHT
);

interface ImageEditorProps {
  imageDataUrl: string;
  onComplete: (editedImageDataUrl: string) => void;
}

export default function ImageEditor({ imageDataUrl, onComplete }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [brushWidth, setBrushWidth] = useState(3);
  const [brushStyle, setBrushStyle] = useState<'pencil' | 'circle' | 'spray'>('pencil');
  const [brushColor, setBrushColor] = useState<'#000000' | '#ffffff'>('#000000');
  const historyRef = useRef<any[]>([]);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  const isMobile = useIsMobile();

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: IMAGE_CONFIG.TARGET_WIDTH,
      height: IMAGE_CONFIG.TARGET_HEIGHT,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricCanvas);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const fabricImg = new fabric.Image(img);
      fabricImg.scaleToWidth(IMAGE_CONFIG.TARGET_WIDTH);
      fabricImg.scaleToHeight(IMAGE_CONFIG.TARGET_HEIGHT);

      fabricCanvas.backgroundImage = fabricImg;
      fabricCanvas.renderAll();
    };
    img.src = imageDataUrl;

    const handleObjectAdded = (e: any) => {
      if (e.target) {
        historyRef.current.push(e.target);
      }
    };

    fabricCanvas.on('object:added', handleObjectAdded);

    return () => {
      fabricCanvas.off('object:added', handleObjectAdded);
      fabricCanvas.dispose();
    };
  }, [imageDataUrl]);

  useEffect(() => {
    setZoom(INITIAL_ZOOM);
    setPan({ x: 0, y: 0 });
    setMode('view');
  }, [imageDataUrl]);

  // 切换模式和笔刷设置
  useEffect(() => {
    if (!canvas) return;

    if (mode === 'draw') {
      canvas.selection = false;

      let brush;
      if (brushStyle === 'pencil') {
        brush = new fabric.PencilBrush(canvas);
      } else if (brushStyle === 'circle') {
        brush = new fabric.CircleBrush(canvas);
      } else if (brushStyle === 'spray') {
        brush = new fabric.SprayBrush(canvas);
      } else {
        brush = new fabric.PencilBrush(canvas);
      }

      brush.color = brushColor;
      brush.width = brushWidth;

      canvas.freeDrawingBrush = brush;
    } else {
      canvas.selection = true;
    }

    canvas.isDrawingMode = mode === 'draw';
  }, [mode, canvas, brushWidth, brushStyle, brushColor]);

  // 添加文字
  const handleAddText = () => {
    if (!canvas) return;

    let left = 100;
    let top = 100;

    if (canvasRef.current && containerRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const centerY = containerRect.top + containerRect.height / 2;
      const relativeX = (centerX - canvasRect.left) / canvasRect.width;
      const relativeY = (centerY - canvasRect.top) / canvasRect.height;

      left = Math.max(0, Math.min(IMAGE_CONFIG.TARGET_WIDTH, relativeX * IMAGE_CONFIG.TARGET_WIDTH));
      top = Math.max(0, Math.min(IMAGE_CONFIG.TARGET_HEIGHT, relativeY * IMAGE_CONFIG.TARGET_HEIGHT));
    }

    const text = new fabric.IText('双击编辑文字', {
      left,
      top,
      fontSize: 24,
      fill: '#000000',
      fontFamily: 'Arial',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setMode('view');
  };

  // 撤销上一步操作
  const handleUndo = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length > 0) {
      // 移除最后一个对象
      const lastObject = objects[objects.length - 1];
      canvas.remove(lastObject);

      // 从历史记录中移除
      historyRef.current.pop();

      canvas.renderAll();
    }
  };

  // 完成编辑
  const handleComplete = () => {
    if (!canvas) return;

    // 临时重置缩放，确保导出原始尺寸
    const originalZoom = zoom;
    setZoom(INITIAL_ZOOM);

    // 等待缩放重置后导出
    setTimeout(() => {
      // 导出为图片，使用适中的质量以减小文件大小
      const dataUrl = canvas.toDataURL({
        multiplier: 1,
        format: 'png',
        quality: 0.8, // 降低质量以减小文件大小
      });

      // 恢复缩放
      setZoom(originalZoom);

      onComplete(dataUrl);
    }, 100);
  };

  // 处理鼠标滚轮缩放
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // 计算新的缩放值，最小就是INITIAL_ZOOM
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(INITIAL_ZOOM, Math.min(3, prev + delta)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // 鼠标拖拽平移
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let startPan = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (mode === 'draw' || e.button !== 0) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      startPan = { ...panRef.current };
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: startPan.x + (e.clientX - startX),
        y: startPan.y + (e.clientY - startY),
      });
    };

    const handleMouseUp = () => {
      isPanning = false;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mode]);

  // 处理触摸手势缩放与拖拽
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialZoom = 1;
    let isTouchPanning = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchPanStart = { x: 0, y: 0 };

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = zoom;
        isTouchPanning = false;
      } else if (e.touches.length === 1 && mode !== 'draw') {
        isTouchPanning = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchPanStart = { ...panRef.current };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(INITIAL_ZOOM, Math.min(3, initialZoom * scale));
        setZoom(newZoom);
      } else if (isTouchPanning && e.touches.length === 1) {
        e.preventDefault();
        setPan({
          x: touchPanStart.x + (e.touches[0].clientX - touchStartX),
          y: touchPanStart.y + (e.touches[0].clientY - touchStartY),
        });
      }
    };

    const handleTouchEnd = () => {
      isTouchPanning = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoom, mode]);

  return (
    <div className="space-y-4">
      {/* 画布区域 */}
      <wired-card elevation="2">
        <div className="p-4 flex justify-center">
          <div
            ref={containerRef}
            className="bg-gray-100 rounded-lg overflow-hidden relative"
            style={{
              width: isMobile ? '100%' : `${CONTAINER_CONFIG.WIDTH}px`,
              height: isMobile ? '360px' : `${CONTAINER_CONFIG.HEIGHT}px`
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </wired-card>

      {/* 工具栏 */}
      <wired-card elevation="2">
        <div className="p-4">
          <div className="space-y-4">
            {/* 工具按钮 */}
            <div className="flex gap-2 justify-center flex-nowrap overflow-x-auto">
              <wired-button
                elevation={mode === 'draw' ? 2 : 0}
                onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
              >
                {mode === 'draw' ? '退出手绘' : '开启手绘'}
              </wired-button>
              <wired-button
                onClick={handleAddText}
              >
                添加文字
              </wired-button>
              <wired-button
                onClick={handleUndo}
              >
                撤销
              </wired-button>
            </div>

            {/* 笔刷设置 - 仅在手绘模式下显示 */}
            {mode === 'draw' && (
              <div className="space-y-3 border-t border-gray-300 pt-3">
                {/* 笔刷粗细 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium min-w-[60px]">粗细：</label>
                  <div className="flex-1">
                    <wired-slider
                      value={brushWidth}
                      min="1"
                      max="50"
                      step="1"
                      onchange={(e: any) => setBrushWidth(Number(e.detail.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <span className="text-sm min-w-[40px]">{brushWidth}px</span>
                </div>

                {/* 笔刷风格 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium min-w-[60px]">风格：</label>
                  <div className="flex gap-2">
                    <wired-button
                      elevation={brushStyle === 'pencil' ? 2 : 0}
                      onClick={() => setBrushStyle('pencil')}
                    >
                      铅笔
                    </wired-button>
                    <wired-button
                      elevation={brushStyle === 'circle' ? 2 : 0}
                      onClick={() => setBrushStyle('circle')}
                    >
                      圆圈
                    </wired-button>
                    <wired-button
                      elevation={brushStyle === 'spray' ? 2 : 0}
                      onClick={() => setBrushStyle('spray')}
                    >
                      喷雾
                    </wired-button>
                  </div>
                </div>

                {/* 笔刷颜色 */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium min-w-[60px]">颜色：</label>
                  <div className="flex gap-2">
                    <wired-button
                      elevation={brushColor === '#000000' ? 2 : 0}
                      onClick={() => setBrushColor('#000000')}
                    >
                      黑色
                    </wired-button>
                    <wired-button
                      elevation={brushColor === '#ffffff' ? 2 : 0}
                      onClick={() => setBrushColor('#ffffff')}
                    >
                      白色
                    </wired-button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </wired-card>

      {/* 操作按钮 */}
      <div className="flex justify-center mt-4">
        <wired-button onClick={handleComplete} style={{ minWidth: '180px' }}>
          完成
        </wired-button>
      </div>
    </div>
  );
}
