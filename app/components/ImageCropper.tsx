'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

const IMAGE_CONFIG = {
  TARGET_WIDTH: 596,
  TARGET_HEIGHT: 832,
  ASPECT_RATIO: 596 / 832,
};

interface ImageCropperProps {
  file: File;
  imageUrl?: string;
  onComplete: (cropArea: Area, imageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ file, imageUrl: providedImageUrl, onComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (providedImageUrl) {
      setImageUrl(providedImageUrl);
    } else {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, providedImageUrl]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels && imageUrl) {
      onComplete(croppedAreaPixels, imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="relative bg-gray-100 rounded-lg overflow-hidden"
        style={{ height: isMobile ? '320px' : '450px' }}
      >
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={IMAGE_CONFIG.ASPECT_RATIO}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: {
              backgroundColor: '#f3f4f6',
            },
            cropAreaStyle: {
              border: '4px solid #FF6B6B',
            },
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">缩放: {zoom.toFixed(2)}x</label>
        <wired-slider
          value={zoom}
          min="1"
          max="3"
          step="0.01"
          onchange={(e: any) => setZoom(Number(e.detail.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <wired-button
          onClick={handleConfirm}
          style={{ flex: 1 }}
        >
          确认裁剪
        </wired-button>
        <wired-button
          onClick={onCancel}
          style={{ flex: 1 }}
        >
          取消
        </wired-button>
      </div>

      <div className="text-center text-sm text-gray-600">
        最终输出：596 × 832 PNG 黑白图
      </div>
    </div>
  );
}
