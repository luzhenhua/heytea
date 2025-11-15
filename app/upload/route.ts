import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import FormDataNode from 'form-data';
import axios from 'axios';

const IMAGE_CONFIG = {
  TARGET_WIDTH: 596,
  TARGET_HEIGHT: 832,
  MIN_SIZE_KB: 80,
  MAX_SIZE_KB: 140, // 留有40KB安全边际，确保不超过180KB限制
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const cropAreaStr = formData.get('cropArea') as string;
    const width = formData.get('width') as string;
    const height = formData.get('height') as string;
    const sign = formData.get('sign') as string;
    const t = formData.get('t') as string;
    const token = formData.get('token') as string;

    console.log('收到上传请求:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      cropArea: cropAreaStr,
      width,
      height,
      sign,
      t,
      token: token?.substring(0, 20) + '...'
    });

    if (!file || !cropAreaStr) {
      return NextResponse.json(
        { code: -1, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const cropArea = JSON.parse(cropAreaStr);

    // 读取原始图片
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 sharp 处理图片：裁剪 + 缩放到目标尺寸 + 转黑白
    let processedImage = sharp(buffer)
      .extract({
        left: Math.round(cropArea.x),
        top: Math.round(cropArea.y),
        width: Math.round(cropArea.width),
        height: Math.round(cropArea.height),
      })
      .resize(IMAGE_CONFIG.TARGET_WIDTH, IMAGE_CONFIG.TARGET_HEIGHT, {
        fit: 'fill',
      })
      .grayscale(); // 转换为黑白（灰度图）

    // 压缩到目标大小范围 (100-180KB)
    let quality = 92;
    let pngBuffer: Buffer;
    let sizeKB: number;

    console.log('开始压缩...');

    for (let i = 0; i < 20; i++) {
      pngBuffer = await processedImage
        .png({
          quality: quality,
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toBuffer();

      sizeKB = pngBuffer.length / 1024;
      console.log(`PNG质量: ${quality}, 大小: ${sizeKB.toFixed(1)}KB`);

      if (sizeKB >= IMAGE_CONFIG.MIN_SIZE_KB && sizeKB <= IMAGE_CONFIG.MAX_SIZE_KB) {
        console.log(`✓ 压缩成功: ${sizeKB.toFixed(1)}KB`);
        break;
      }

      if (sizeKB < IMAGE_CONFIG.MIN_SIZE_KB) {
        // 文件太小，提高质量
        quality = Math.min(100, quality + 2);
      } else {
        // 文件太大，降低质量
        quality = Math.max(50, quality - 5);
      }

      if (i === 19) {
        console.warn(`压缩完成，但大小为 ${sizeKB.toFixed(1)}KB`);
      }
    }

    console.log('最终文件信息:', {
      name: `${t}.png`,
      type: 'image/png',
      size: pngBuffer!.length,
      sizeKB: (pngBuffer!.length / 1024).toFixed(1) + 'KB'
    });

    // 使用正确的喜茶上传API地址
    const UPLOAD_API_URL = `https://app-go.heytea.com/api/service-cps/user/diy?sign=${sign}&t=${t}`;

    // 使用Node.js的form-data构造FormData
    const uploadFormData = new FormDataNode();
    uploadFormData.append('file', pngBuffer!, {
      filename: `${t}.png`,
      contentType: 'image/png',
    });
    uploadFormData.append('width', width);
    uploadFormData.append('height', height);

    console.log('发送上传请求到:', UPLOAD_API_URL);
    console.log('FormData headers:', uploadFormData.getHeaders());

    try {
      const response = await axios.post(UPLOAD_API_URL, uploadFormData, {
        headers: {
          'Authorization': token,
          ...uploadFormData.getHeaders(),
        },
        timeout: 60000, // 60秒超时
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('上传响应状态:', response.status);
      console.log('上传响应数据:', response.data);

      return NextResponse.json(response.data);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error('上传超时');
        return NextResponse.json(
          { code: -1, message: '上传超时，请检查网络连接后重试' },
          { status: 408 }
        );
      }

      console.error('上传错误:', error.response?.data || error.message);
      return NextResponse.json(
        {
          code: -1,
          message: '上传失败',
          detail: error.response?.data || error.message,
          status: error.response?.status
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('上传错误:', error);
    return NextResponse.json(
      { code: -1, message: '上传失败', error: String(error) },
      { status: 500 }
    );
  }
}
