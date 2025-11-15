import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://go.heytea.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method = 'POST', headers = {}, body: requestBody = {} } = body;

    const targetUrl = `${API_BASE_URL}${url}`;

    // 添加常见的移动端请求头
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Origin': 'https://go.heytea.com',
      'Referer': 'https://go.heytea.com/',
      'appVersion': '5.2.0',
      'platform': 'ios',
      'deviceId': 'heytea-web-' + Date.now(),
    };

    const fetchOptions: RequestInit = {
      method: method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    };

    if (method !== 'GET' && requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    console.log('API代理请求:', {
      url: targetUrl,
      method,
      headers: fetchOptions.headers,
    });

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    console.log('API代理响应:', {
      status: response.status,
      data,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API代理错误:', error);
    return NextResponse.json(
      { code: -1, message: '请求失败' },
      { status: 500 }
    );
  }
}
