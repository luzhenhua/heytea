'use client';

import { useState, useEffect } from 'react';
import { loginByPhone, loginByToken, sendVerifyCode } from '@/lib/api';
import { encryptPhone } from '@/lib/crypto';

export default function LoginPanel({ setUser }: any) {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'token'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleGetCode = async () => {
    if (!phone || phone.length !== 11) {
      setStatus({ type: 'error', message: '请输入正确的手机号' });
      return;
    }

    try {
      setStatus({ type: 'info', message: '发送中...' });
      const encryptedPhone = encryptPhone(phone);
      const result = await sendVerifyCode(encryptedPhone);

      if (result.code === 0) {
        setStatus({ type: 'success', message: '验证码已发送' });
        setCountdown(60);
      } else {
        setStatus({ type: 'error', message: result.message || '发送失败' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '网络错误' });
    }
  };

  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      setStatus({ type: 'error', message: '请输入手机号和验证码' });
      return;
    }

    try {
      setStatus({ type: 'info', message: '登录中...' });
      const encryptedPhone = encryptPhone(phone);
      const result = await loginByPhone(encryptedPhone, code);

      if (result.code === 0 && result.data) {
        const userData = {
          name: result.data.nickName || result.data.name || '-',
          phone: phone,
          id: result.data.userMainId || result.data.id || '-',
          token: result.data.token || '-',
        };
        setUser(userData);
        setStatus({ type: 'success', message: '登录成功！' });
      } else {
        setStatus({ type: 'error', message: result.message || '登录失败' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '网络错误' });
    }
  };

  const handleTokenLogin = async () => {
    if (!token) {
      setStatus({ type: 'error', message: '请输入Token' });
      return;
    }

    try {
      setStatus({ type: 'info', message: '验证中...' });
      const result = await loginByToken(token);

      if (result.code === 0 && result.data) {
        const userData = {
          name: result.data.name || result.data.nickName || '-',
          phone: result.data.phone || '-',
          id: result.data.user_main_id || result.data.userMainId || result.data.id || '-',
          token: token,
        };
        setUser(userData);
        setStatus({ type: 'success', message: 'Token验证成功！' });
      } else {
        setStatus({ type: 'error', message: result.message || 'Token无效' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '网络错误' });
    }
  };

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <wired-card elevation="3">
      <h2 className="text-2xl font-bold mb-6">登录</h2>

      {/* 登录方式切换 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <wired-button
          onClick={() => setLoginMethod('phone')}
          elevation={loginMethod === 'phone' ? 2 : 0}
          style={{ flex: 1 }}
        >
          手机号登录
        </wired-button>
        <wired-button
          onClick={() => setLoginMethod('token')}
          elevation={loginMethod === 'token' ? 2 : 0}
          style={{ flex: 1 }}
        >
          Token登录
        </wired-button>
      </div>

      {loginMethod === 'phone' ? (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">手机号</label>
            <wired-input
              placeholder="请输入手机号"
              value={phone}
              onInput={(e: any) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">验证码</label>
            <div className="flex gap-2 items-center">
              <wired-input
                placeholder="验证码"
                value={code}
                onInput={(e: any) => setCode(e.target.value)}
                style={{ flex: 1, minWidth: '0' }}
              />
              <wired-button
                onClick={handleGetCode}
                disabled={countdown > 0}
                style={{ width: '110px' }}
              >
                {countdown > 0 ? `${countdown}s` : '获取'}
              </wired-button>
            </div>
          </div>

          <div className="flex justify-center">
            <wired-button
              onClick={handlePhoneLogin}
              style={{ minWidth: '180px' }}
            >
              登录
            </wired-button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold">Token</label>
            <wired-input
              placeholder="请输入Token"
              value={token}
              onInput={(e: any) => setToken(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-2">从喜茶APP获取</p>
          </div>

          <div className="flex justify-center">
            <wired-button
              onClick={handleTokenLogin}
              style={{ minWidth: '180px' }}
            >
              验证
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
