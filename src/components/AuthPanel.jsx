import React from 'react';
import { Cloud } from 'lucide-react';
import CaptchaBox from './CaptchaBox.jsx';

const AuthPanel = ({
  recoveryMode,
  newPassword,
  setNewPassword,
  updatePassword,
  authError,
  authMode,
  setAuthMode,
  setAuthError,
  email,
  setEmail,
  password,
  setPassword,
  handleAuth,
  sendResetEmail,
  captchaInput,
  setCaptchaInput,
  captchaImage,
  captchaText,
  refreshCaptcha,
  captchaFails,
  captchaLockUntil
}) => {
  return (
    <div className="min-h-screen text-slate-900 pb-24">
      <div className="max-w-md mx-auto p-6 md:p-10">
        <div className="card-soft p-8 mt-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#3b2e4a] flex items-center gap-2 mb-2">
            <Cloud className="w-7 h-7 text-[#ff8acb]" /> 云朵清单
          </h1>
          <p className="text-[#7b6f8c] mb-6">登录后即可同步你的清单。</p>
          {recoveryMode ? (
            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="设置新密码"
                className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
              />
              {authError && (
                <div className="text-xs text-[#ff6fb1]">{authError}</div>
              )}
              <button type="button" onClick={updatePassword} className="w-full btn-soft py-3 rounded-2xl font-bold transition-all">
                更新密码
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
                />
                <CaptchaBox
                  captchaInput={captchaInput}
                  setCaptchaInput={setCaptchaInput}
                  captchaImage={captchaImage}
                  captchaText={captchaText}
                  refreshCaptcha={refreshCaptcha}
                  captchaFails={captchaFails}
                  captchaLockUntil={captchaLockUntil}
                />
                {authError && (
                  <div className="text-xs text-[#ff6fb1]">{authError}</div>
                )}
                <button type="submit" className="w-full btn-soft py-3 rounded-2xl font-bold transition-all">
                  {authMode === 'signup' ? '注册' : '登录'}
                </button>
              </form>
              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                    setAuthError('');
                  }}
                  className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                >
                  {authMode === 'signup' ? '已有账号？去登录' : '没有账号？去注册'}
                </button>
                <button
                  type="button"
                  onClick={sendResetEmail}
                  className="text-[#7b6f8c] hover:text-[#ff6fb1]"
                >
                  忘记密码
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPanel;
