'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { normalizeToken } from '@/lib/token';
import { loginByToken } from '@/lib/api';

const LoginPanel = dynamic(() => import('./components/LoginPanel'), { ssr: false });
const UploadPanel = dynamic(() => import('./components/UploadPanel'), { ssr: false });

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [sessionAlert, setSessionAlert] = useState<string | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const getSessionExpiredMessage = (message?: string) => {
    if (!message) return '登录状态已失效，请重新登录';
    if (message.toUpperCase() === 'TOKEN_INVALID') {
      return '登录状态已失效，请重新登录';
    }
    if (message.toLowerCase().includes('token')) {
      return '登录状态已失效，请重新登录';
    }
    return message;
  };

  useEffect(() => {
    // 动态导入 wired-elements
    import('wired-elements').then(() => {
      setLoaded(true);
    });

    // 从 localStorage 恢复用户信息
    const savedUser = localStorage.getItem('heyteaUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          parsed.token = normalizeToken(parsed.token);
        }
        setUser(parsed);
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
    const normalizedUser = userData
      ? { ...userData, token: normalizeToken(userData.token) }
      : null;
    setUser(normalizedUser);
    if (normalizedUser) {
      localStorage.setItem('heyteaUser', JSON.stringify(normalizedUser));
      setSessionAlert(null);
    } else {
      localStorage.removeItem('heyteaUser');
    }
    setShowDetails(false);
  };

  useEffect(() => {
    if (!user?.token) return;

    let canceled = false;
    let checking = false;

    const runCheck = async () => {
      if (checking || !user?.token) return;
      checking = true;
      try {
        const result = await loginByToken(user.token);
        if (canceled) return;

        if (result.code !== 0 || !result.data) {
          const message = getSessionExpiredMessage(result.message);
          handleSetUser(null);
          setSessionAlert(message);
        }
      } catch (error) {
        console.error('登录状态检查失败:', error);
      } finally {
        checking = false;
      }
    };

    runCheck();

    const handleFocus = () => {
      runCheck();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        runCheck();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const intervalId = window.setInterval(runCheck, 60000);

    return () => {
      canceled = true;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [user?.token]);

  const handleSessionExpired = (message?: string) => {
    handleSetUser(null);
    setSessionAlert(getSessionExpiredMessage(message));
  };

  const handleDismissAnnouncement = () => {
    setShowAnnouncement(false);
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
    <>
      {showAnnouncement && (
        <div className="announcement-overlay animate-fade-in">
          <div className="absolute inset-0 bg-black/40" />
          <wired-card
            elevation="3"
            class="max-w-lg w-full announcement-card"
            style={{ zIndex: 60, position: 'relative' }}
          >
            <div className="announcement-body text-left">
              <div className="announcement-tape" aria-hidden="true" />
              <div className="announcement-content">
                <div className="announcement-header">
                  <p className="text-2xl font-bold text-orange-900 mb-2">想对你说的话</p>
                  <p className="announcement-meta">很抱歉总要用这种方式打扰你，但我想先让你知道真相</p>
                </div>
                <div className="announcement-paragraphs text-sm text-gray-800">
                  <p>
                    喜茶把我们借用的上传通道彻底锁住了，所以现在一按上传就会跳出
                    <span className="font-semibold text-red-700">“检测到非法的上传请求，本次操作已被拦截。”</span>
                    这句提示完全来自喜茶的风控，他们阻止的是接口本身，不是你，也不是这个小站。
                  </p>
                  <p>
                    我把空闲时间都用来尝试各种办法，偶尔靠运气能冲过去，可大多数时候仍旧被挡下。想到你满怀期待地点开按钮却被这句话泼冷水，心里真的会跟着揪起来。
                  </p>
                  <p>
                    如果你已经重试很多次，先深呼吸一下，别把责任揽在自己身上。限制来自喜茶，我无法帮你绕开，但可以陪你一起等待那一点点好运气。
                  </p>
                  <p>
                    我只是一个喜欢写代码的学生，平时也要上课，但空下来就会把这个按钮守好。能够陪伴大家我已经很幸运，没帮上的也请别失望，我们一起慢慢等那次能顺利贴上喜欢的图案。
                  </p>
                  <p>
                    如果你脑子里有一些小创意，暂时没有人帮你做成 App 或网页，也欢迎来找我，可以在{' '}
                    <a
                      href="https://www.xiaohongshu.com/user/profile/6554bb560000000002035357"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-orange-800"
                    >
                      小红书
                    </a>
                    或{' '}
                    <a
                      href="https://www.douyin.com/user/MS4wLjABAAAAe_UbKX_yOC03iIH10AmzlJJSnt_O0CecI1naUtR5qjNKNKd4Gqg8Hw1tyOfeHRLA?from_tab_name=main"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-orange-800"
                    >
                      抖音
                    </a>
                    上联系我。周一到周五我在学校上课，回复会慢一些，但我会尽力帮助每一位朋友。
                  </p>
                </div>
                <div className="announcement-action pt-4">
                  <wired-button onClick={handleDismissAnnouncement}>
                    收到拥抱，再试试看
                  </wired-button>
                </div>
              </div>
            </div>
          </wired-card>
        </div>
      )}
      <main className="min-h-screen p-4 md:p-8">
        <div className="max-w-lg mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">喜茶Diy杯贴</h1>
        </div>

        <div className="mb-6 animate-fade-in">
          <wired-card elevation="2">
            <div className="p-4 text-center space-y-3">
              <p className="text-base font-semibold text-gray-800">
                第一次使用？建议用 1 分钟先看看常见问题，很多坑都写好了。
              </p>
              <p className="text-sm text-gray-600">
                里面有验证码异常、上传次数限制、浏览器兼容等说明，可以省去来回折腾的功夫。
              </p>
              <wired-button onClick={() => (window.location.href = '/faq')}>
                浏览常见问题
              </wired-button>
            </div>
          </wired-card>
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
                      onClick={() => {
                        handleSetUser(null);
                        setSessionAlert(null);
                      }}
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

        {sessionAlert && (
          <div className="mb-6 animate-fade-in">
            <wired-card elevation="2">
              <div className="p-4 text-center text-red-600 font-semibold">
                {sessionAlert}
              </div>
            </wired-card>
          </div>
        )}

        {/* 上传区域 - 核心区域 */}
        {user && (
          <div className="section-spacing animate-fade-in">
            <UploadPanel user={user} onSessionExpired={handleSessionExpired} />
          </div>
        )}

        <div className="mt-12 animate-fade-in">
          <wired-card elevation="3">
            <div className="p-5 text-center space-y-4" style={{ background: '#fff7ed', borderRadius: '12px' }}>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-orange-800">温馨声明</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  喜茶 App 只能手绘上传，让很多不会画画的朋友很为难。我只是一个普通开发者（
                  <a
                    href="https://www.luzhenhua.cn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-orange-700"
                  >
                    卢振华
                  </a>
                  ）想帮大家把喜欢的照片或图案也能贴到杯子上，于是做了这个完全公益的小工具，与喜茶官方没有任何运营关系。
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  网站不会存储任何个人信息，所有代码都公开在
                  {' '}
                  <a
                    href="https://github.com/luzhenhua/heytea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold text-orange-700"
                  >
                    GitHub
                  </a>
                  ，欢迎检查。如果这个项目无意影响到您的权益，请发邮件到
                  {' '}
                  <a href="mailto:luzhenhuadev@qq.com" className="underline text-gray-800">
                    luzhenhuadev@qq.com
                  </a>
                  ，我会第一时间处理。
                </p>
              </div>
            </div>
          </wired-card>
        </div>

        {/* 页脚 */}
        <div className="h-8" />
      </div>
    </main>
    </>
  );
}
