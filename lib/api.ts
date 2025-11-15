const API_BASE = '/api';
const UPLOAD_API = '/upload';

export async function apiRequest(url: string, data: any, headers: any = {}, method: string = 'POST') {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        method: method,
        headers: headers,
        body: data || {}
      })
    });
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

export async function sendVerifyCode(encryptedPhone: string) {
  const requestData = {
    cryptoLevel: 2,
    ticketFrom: "min",
    brandId: "1000001",
    mobile: encryptedPhone,
    client: "app",
    zone: "86"
  };

  return await apiRequest(
    '/api/service-member/openapi/vip/user/sms/verifiyCode/send',
    requestData
  );
}

export async function loginByPhone(encryptedPhone: string, code: string) {
  const requestData = {
    client: "app",
    channel: "A",
    phone: encryptedPhone,
    zone: "86",
    cryptoLevel: 2,
    smsCode: code,
    email: null,
    brand: "1000001",
    ticketFrom: "min",
    loginType: "APP_CODE"
  };

  return await apiRequest(
    '/api/service-login/openapi/vip/user/login_v1',
    requestData
  );
}

export async function loginByToken(token: string) {
  return await apiRequest(
    '/api/service-member/vip/user/info',
    {},
    { 'Authorization': `Bearer ${token}` },
    'GET'
  );
}

export async function uploadImage(formData: FormData) {
  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    body: formData
  });

  return await response.json();
}
