declare const CryptoJS: any;

const AES_KEY = '23290CFFBB5D39B8';
const AES_IV = 'HEYTEA1A2B3C4D5E';

export function encryptPhone(phone: string): string {
  const key = CryptoJS.enc.Utf8.parse(AES_KEY);
  const iv = CryptoJS.enc.Utf8.parse(AES_IV);
  const encrypted = CryptoJS.AES.encrypt(phone, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

export function md5(string: string): string {
  function rotateLeft(value: number, shift: number) {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(string: string) {
    let wordArray: number[] = [];
    for (let i = 0; i < string.length * 8; i += 8) {
      wordArray[i >> 5] |= (string.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return wordArray;
  }

  function wordToHex(value: number) {
    let hex = '';
    for (let i = 0; i < 4; i++) {
      hex += ((value >> (i * 8 + 4)) & 0x0F).toString(16) + ((value >> (i * 8)) & 0x0F).toString(16);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  x[string.length * 8 >> 5] |= 0x80 << (string.length * 8 % 32);
  x[(((string.length * 8 + 64) >>> 9) << 4) + 14] = string.length * 8;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;

    a = FF(a, b, c, d, x[i + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[i + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[i + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[i + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[i + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[i + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[i + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[i + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[i + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[i + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[i + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[i + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[i + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[i + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[i + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[i + 15], S14, 0x49B40821);

    a = GG(a, b, c, d, x[i + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[i + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[i + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[i + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[i + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[i + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[i + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[i + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[i + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[i + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[i + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[i + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[i + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[i + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[i + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[i + 12], S24, 0x8D2A4C8A);

    a = HH(a, b, c, d, x[i + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[i + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[i + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[i + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[i + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[i + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[i + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[i + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[i + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[i + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[i + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[i + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[i + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[i + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[i + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[i + 2], S34, 0xC4AC5665);

    a = II(a, b, c, d, x[i + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[i + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[i + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[i + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[i + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[i + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[i + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[i + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[i + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[i + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[i + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[i + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[i + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[i + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[i + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[i + 9], S44, 0xEB86D391);

    a = addUnsigned(a, olda);
    b = addUnsigned(b, oldb);
    c = addUnsigned(c, oldc);
    d = addUnsigned(d, oldd);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

export function generateUploadSign(userId: string) {
  const t = Date.now();
  const signStr = 'r5YWPjgSGAT2dbOJzwiDBK' + userId + t;
  const sign = md5(signStr);
  console.log('签名字符串:', signStr);
  console.log('签名结果:', sign);
  return { sign, t };
}
