'use client';

import { useState, useRef } from 'react';
import ImageCropper from './ImageCropper';
import ImageEditor from './ImageEditor';
import { uploadImage } from '@/lib/api';
import { generateUploadSign } from '@/lib/crypto';
import { normalizeToken } from '@/lib/token';
import { compressImage } from '@/lib/image';
import type { Area } from 'react-easy-crop';

const IMAGE_CONFIG = {
  TARGET_WIDTH: 596,
  TARGET_HEIGHT: 832,
};

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toGrayscaleData(imageData: ImageData) {
  const { data } = imageData;
  const grayscale = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;

    grayscale[i] = grayscale[i + 1] = grayscale[i + 2] = gray;
    grayscale[i + 3] = data[i + 3];
  }

  return grayscale;
}

function convertToGrayscale(image: HTMLImageElement) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const grayscaleData = toGrayscaleData(imageData);
  ctx.putImageData(new ImageData(grayscaleData, width, height), 0, 0);
  return canvas.toDataURL('image/png');
}

async function createCanvasFromDataUrl(dataUrl: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('图片加载失败'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_CONFIG.TARGET_WIDTH;
  canvas.height = IMAGE_CONFIG.TARGET_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
}

async function buildCompressedFile(dataUrl: string, fileBaseName: string) {
  const canvas = await createCanvasFromDataUrl(dataUrl);
  const compressedBlob = await compressImage(canvas);
  const blobType = compressedBlob.type || 'image/png';
  const extension = blobType.includes('jpeg') ? 'jpg' : 'png';

  return {
    file: new File([compressedBlob], `${fileBaseName}.${extension}`, {
      type: blobType,
    }),
    sizeKB: compressedBlob.size / 1024,
  };
}

export default function UploadPanel({ user }: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: '请选择图片文件' });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setStatus({ type: 'info', message: '处理中...' });

    try {
      // 读取文件并转为黑白
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const processedDataUrl = convertToGrayscale(img);
        setProcessedImageUrl(processedDataUrl);
        setCroppedImageUrl(null);
        setEditedImageUrl(null);
        setShowEditor(false);
        setShowCropTool(true);
        setIsProcessing(false);
        setStatus({
          type: 'success',
          message: '处理完成！请裁剪图片',
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessing(false);
      setStatus({ type: 'error', message: '处理失败' });
    }
  };

  const handleCropComplete = async (cropArea: Area, imageUrl: string) => {
    // 生成裁剪后的图
    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_CONFIG.TARGET_WIDTH;
    canvas.height = IMAGE_CONFIG.TARGET_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // 裁剪并绘制到canvas
    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      IMAGE_CONFIG.TARGET_WIDTH,
      IMAGE_CONFIG.TARGET_HEIGHT
    );

    const croppedDataUrl = canvas.toDataURL('image/png');
    setCroppedImageUrl(croppedDataUrl);
    setShowCropTool(false);
    setShowEditor(true);
    setStatus({
      type: 'success',
      message: '裁剪完成！现在可以添加文字或手绘',
    });
  };

  const handleEditorComplete = (editedDataUrl: string) => {
    setEditedImageUrl(editedDataUrl);
    setShowEditor(false);
    setStatus({
      type: 'success',
      message: '编辑完成！可以上传了',
    });
  };

  const handleUpload = async () => {
    if (!editedImageUrl || !selectedFile) {
      setStatus({ type: 'error', message: '请先完成编辑' });
      return;
    }

    try {
      setStatus({ type: 'info', message: '压缩图片中...' });

      const { sign, t } = generateUploadSign(user.id);
      const { file, sizeKB } = await buildCompressedFile(editedImageUrl, t.toString());

      setStatus({ type: 'info', message: `上传中... (${sizeKB.toFixed(1)}KB)` });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('cropArea', JSON.stringify({ x: 0, y: 0, width: IMAGE_CONFIG.TARGET_WIDTH, height: IMAGE_CONFIG.TARGET_HEIGHT }));
      formData.append('width', IMAGE_CONFIG.TARGET_WIDTH.toString());
      formData.append('height', IMAGE_CONFIG.TARGET_HEIGHT.toString());
      const sanitizedToken = normalizeToken(user.token);
      const bearerToken = sanitizedToken ? `Bearer ${sanitizedToken}` : '';
      formData.append('sign', sign);
      formData.append('t', t.toString());
      formData.append('token', bearerToken);

      const result = await uploadImage(formData);

      if (result.code === 0) {
        setStatus({
          type: 'success',
          message: `上传成功！${result.data?.url || ''}`,
        });

        setTimeout(() => {
          handleClear();
        }, 3000);
      } else {
        setStatus({ type: 'error', message: result.message || '上传失败，请重试' });
      }
    } catch (error: any) {
      console.error('上传错误:', error);
      const errorMessage = error.message || '网络连接失败，请检查网络后重试';
      setStatus({ type: 'error', message: errorMessage });
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setProcessedImageUrl(null);
    setCroppedImageUrl(null);
    setEditedImageUrl(null);
    setShowCropTool(false);
    setShowEditor(false);
    setStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <wired-card elevation="3">
      <h2 className="text-2xl font-bold mb-6">图片上传</h2>

      {/* 初始上传区域 */}
      {!processedImageUrl && !isProcessing && (
        <wired-card
          elevation="2"
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <div className="px-6 py-8 md:p-12 text-center">
            <p className="text-lg font-semibold mb-2">点击选择图片</p>
            <p className="text-sm text-gray-600 mb-3">支持 JPG, PNG, GIF</p>
            <p className="text-sm font-semibold">
              自动转为黑白图，可裁剪和编辑
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </wired-card>
      )}

      {/* 处理中 */}
      {isProcessing && (
        <div className="text-center py-12">
          <p className="text-lg font-semibold">处理中...</p>
          <p className="text-sm text-gray-600 mt-2">正在转换为黑白图</p>
        </div>
      )}

      {/* 裁剪工具 */}
      {showCropTool && processedImageUrl && (
        <ImageCropper
          file={selectedFile!}
          imageUrl={processedImageUrl}
          onComplete={handleCropComplete}
          onCancel={handleClear}
        />
      )}

      {/* 编辑器 */}
      {showEditor && croppedImageUrl && (
        <ImageEditor
          imageDataUrl={croppedImageUrl}
          onComplete={handleEditorComplete}
        />
      )}

      {/* 最终预览和上传 */}
      {editedImageUrl && !showEditor && !showCropTool && (
        <div className="space-y-4">
          {/* 预览区域 */}
          <wired-card elevation="2">
            <div className="p-4 text-center">
              <img
                src={editedImageUrl}
                alt="预览"
                className="max-w-full h-auto inline-block"
                style={{ maxWidth: '300px' }}
              />
            </div>
          </wired-card>

          {/* 按钮在下方 */}
          <div className="flex gap-3 flex-wrap">
            <wired-button onClick={handleUpload} style={{ flex: 1 }}>
              开始上传
            </wired-button>
            <wired-button onClick={handleClear} style={{ flex: 1 }}>
              重新选择
            </wired-button>
          </div>
        </div>
      )}

      {/* 状态消息 */}
      {status && (
        <div className="mt-4">
          <wired-card elevation="1">
            <div className="p-3 text-center">
              <p className="font-semibold">
                {status.message}
              </p>
            </div>
          </wired-card>
        </div>
      )}
    </wired-card>
  );
}
