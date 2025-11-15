'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const LoginPanel = dynamic(() => import('./components/LoginPanel'), { ssr: false });
const UploadPanel = dynamic(() => import('./components/UploadPanel'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // 动态导入 wired-elements
    import('wired-elements').then(() => {
      setLoaded(true);
    });

    // 从 localStorage 恢复用户信息
    const savedUser = localStorage.getItem('heyteaUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('heyteaUser');
      }
    }
  }, []);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [user]);

  // 保存用户信息到 localStorage
  const handleSetUser = (userData: any) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('heyteaUser', JSON.stringify(userData));
    } else {
      localStorage.removeItem('heyteaUser');
    }
    setShowDetails(false);
  };

  // 手机号打码
  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  if (!loaded) {
    return (
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">加载中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">喜茶Diy杯贴</h1>
        </div>

        {/* 登录区域 */}
        {!user && (
          <div className="section-spacing animate-fade-in">
            <LoginPanel setUser={handleSetUser} />
          </div>
        )}

        {/* 用户信息 - 紧凑模式 */}
        {user && (
          <div className="mb-6 animate-fade-in">
            <wired-card elevation="2">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{user.name}</div>
                    <div className="text-sm text-gray-600">{maskPhone(user.phone)}</div>
                  </div>
                  <div className="flex gap-2">
                    <wired-button
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? '收起' : '详情'}
                    </wired-button>
                    <wired-button
                      onClick={() => handleSetUser(null)}
                    >
                      退出
                    </wired-button>
                  </div>
                </div>

                {/* 详细信息 - 可折叠 */}
                {showDetails && (
                  <div className="mt-4 pt-4 space-y-3 animate-fade-in" style={{ borderTop: '1px solid #e5e7eb' }}>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">用户ID</div>
                      <div className="text-sm font-mono">{user.id}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">Token</div>
                      <div className="text-xs break-all font-mono">{user.token}</div>
                    </div>
                  </div>
                )}
              </div>
            </wired-card>
          </div>
        )}

        {/* 上传区域 - 核心区域 */}
        {user && (
          <div className="section-spacing animate-fade-in">
            <UploadPanel user={user} />
          </div>
        )}

        {/* 页脚 */}
        <div className="text-center text-sm text-gray-500 mt-12 space-y-2">
          <p>喜茶DIY © {new Date().getFullYear()} | 仅供测试使用 | 非官方工具</p>
          <p>
            由{' '}
            <a
              href="https://www.luzhenhua.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              卢振华
            </a>{' '}
            制作
          </p>
          <p>
            <a
              href="https://github.com/luzhenhua/heytea"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
