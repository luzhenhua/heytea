const IMAGE_CONFIG = {
  TARGET_WIDTH: 596,
  TARGET_HEIGHT: 832,
  MAX_SIZE_KB: 180,
};

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg',
  quality?: number
): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('无法生成图像数据'));
      }
    }, type, quality);
  });
}

export async function compressImage(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await canvasToBlob(canvas, 'image/png');
  let sizeKB = pngBlob.size / 1024;
  console.log(`原始PNG格式, 大小: ${sizeKB.toFixed(1)}KB`);

  if (sizeKB <= IMAGE_CONFIG.MAX_SIZE_KB) {
    return pngBlob;
  }

  console.log('文件过大，尝试JPEG压缩...');
  let quality = 0.9;
  let attempts = 0;
  let bestBlob: Blob = pngBlob;

  while (attempts < 25) {
    attempts += 1;
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    sizeKB = jpegBlob.size / 1024;
    console.log(`压缩尝试 #${attempts}: JPEG质量 ${quality.toFixed(2)} -> ${sizeKB.toFixed(1)}KB`);

    if (!bestBlob || jpegBlob.size < bestBlob.size) {
      bestBlob = jpegBlob;
    }

    if (sizeKB <= IMAGE_CONFIG.MAX_SIZE_KB) {
      console.log(`✓ 压缩成功: ${sizeKB.toFixed(1)}KB`);
      return jpegBlob;
    }

    if (quality <= 0.1) {
      break;
    }

    quality = Math.max(0.05, quality - 0.08);
  }

  console.warn(`已达到压缩极限，最终大小 ${bestBlob.size / 1024}KB，仍可能超过限制`);
  return bestBlob;
}

export async function cropImage(
  sourceImage: HTMLImageElement,
  cropRect: { x: number; y: number; width: number; height: number },
  displayWidth: number,
  displayHeight: number
): Promise<Blob> {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = IMAGE_CONFIG.TARGET_WIDTH;
  tempCanvas.height = IMAGE_CONFIG.TARGET_HEIGHT;
  const tempCtx = tempCanvas.getContext('2d')!;

  const scaleX = sourceImage.naturalWidth / displayWidth;
  const scaleY = sourceImage.naturalHeight / displayHeight;

  const srcX = cropRect.x * scaleX;
  const srcY = cropRect.y * scaleY;
  const srcWidth = cropRect.width * scaleX;
  const srcHeight = cropRect.height * scaleY;

  console.log('裁剪参数:', {
    显示区域: cropRect,
    显示尺寸: { width: displayWidth, height: displayHeight },
    源图尺寸: { width: sourceImage.naturalWidth, height: sourceImage.naturalHeight },
    缩放比例: { scaleX, scaleY },
    实际裁剪: { srcX, srcY, srcWidth, srcHeight },
    输出尺寸: { width: IMAGE_CONFIG.TARGET_WIDTH, height: IMAGE_CONFIG.TARGET_HEIGHT }
  });

  tempCtx.drawImage(
    sourceImage,
    srcX, srcY, srcWidth, srcHeight,
    0, 0, IMAGE_CONFIG.TARGET_WIDTH, IMAGE_CONFIG.TARGET_HEIGHT
  );

  return await compressImage(tempCanvas);
}
