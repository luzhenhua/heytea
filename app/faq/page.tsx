'use client';

import { useEffect, useState } from 'react';

const FAQ_ITEMS = [
  {
    question: '验证码提示“当前版本较低，验证失败，请到应用市场下载最新版本”怎么办？',
    answers: [
      '这个提示其实是喜茶的风控在提醒「请换一个更安全的方式取码」，并不是说我们的网站旧了。通常在频繁尝试或切换环境时，系统会更加谨慎。',
      '处理方式很简单：先在喜茶 App 里点一下验证码获取，但不要在 App 中输入并提交，直接回到本页面把手机号和刚收到的验证码输入即可完成登录。'
    ]
  },
  {
    question: '验证码登录时提示“【手机号绑定】验证码已过期！”？',
    answers: [
      '这条提示同样来自喜茶官方接口。验证码窗口很短（常见 60 秒内），如果途中切换网络、反复点击发送或浏览器把页面挂起，即使刚收到短信也可能被判定为旧验证码。',
      '建议保持在同一设备/浏览器操作，不要频繁重新获取，确保系统时间没有被手动调整。若在官方 App 中也同样报错，只能耐心等待或稍后再试，这是风控策略生效。'
    ]
  },
  {
    question: '到底去哪儿获取验证码？',
    answers: [
      '请务必使用官方的「喜茶Go」App（各大应用商店都能搜到）。下载后登录界面会先弹出“本机号码一键登录”，这里千万不要直接点，一旦点了就默认在 App 内完成登录，外部无法得到验证码。',
      '正确操作是点击下方的“其他方式登录”，在出现的输入框里写手机号，再点获取验证码。这样短信才会发送到手机上，你就可以回到本页面输入验证码完成登录了。'
    ]
  },
  {
    question: '上传忽然失败，提示也不太明确，是怎么回事？',
    answers: [
      '喜茶在 App 端对单个账号有每日创作次数以及累计创作总数的限制。达到阈值后，接口会直接拒绝新的作品，即使我们本地图片准备得再充分也没用。',
      '如果遇到这种情况，可以稍微休息一下，或者换一位小伙伴的账号继续创作——经验上更换账号或等次日配额刷新最靠谱。'
    ]
  },
  {
    question: '页面无法选择文件或一直上传不成功？',
    answers: [
      '常见原因是通过应用内置浏览器访问（例如微信、QQ、抖音、小红书或 Bilibili 内的链接），这些内置容器对文件读取的支持非常有限。',
      '建议直接在电脑或手机上的 Chrome、Safari 或 Firefox 浏览器中访问本站，体验会稳定很多，也能最完整地呈现我们的手绘风效果。'
    ]
  }
];

export default function FAQPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import('wired-elements').then(() => setLoaded(true));
  }, []);

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
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">常见问题</h1>
          <p className="text-sm text-gray-600">
            这里整理了大家最近问得最多的几个问题，希望能帮你更快地完成创作。
          </p>
        </div>

        <div className="space-y-6">
          {FAQ_ITEMS.map((item) => (
            <wired-card key={item.question} elevation="2" class="animate-fade-in">
              <div className="p-5 space-y-3">
                <div className="text-lg font-semibold">{item.question}</div>
                {item.answers.map((text, index) => (
                  <p key={index} className="text-sm leading-relaxed text-gray-700">
                    {text}
                  </p>
                ))}
              </div>
            </wired-card>
          ))}

          <wired-card elevation="2" class="animate-fade-in">
            <div className="p-5 text-center space-y-3">
              <p className="text-base font-semibold">需要更多帮助？</p>
              <p className="text-sm text-gray-600">
                可以随时返回首页重新尝试，或把问题反馈给站长，我们会持续完善体验。
              </p>
              <wired-button onClick={() => (window.location.href = '/')}>
                返回首页
              </wired-button>
            </div>
          </wired-card>
        </div>
      </div>
    </main>
  );
}
