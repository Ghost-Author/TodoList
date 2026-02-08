import React from 'react';

const CaptchaBox = ({
  captchaInput,
  setCaptchaInput,
  captchaImage,
  captchaText,
  refreshCaptcha,
  captchaFails,
  captchaLockUntil
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input
          type="text"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
          placeholder="验证码"
          className="flex-1 text-sm bg-white/80 rounded-xl p-3 outline-none ring-1 ring-[#ffe4f2] focus:ring-2 focus:ring-[#ffd7ea]"
        />
        <button
          type="button"
          onClick={() => refreshCaptcha()}
          className="px-2 py-2 rounded-xl bg-white/80 border border-[#ffe4f2] text-[#3b2e4a]"
          title="点击刷新验证码"
        >
          {captchaImage ? (
            <img src={captchaImage} alt="captcha" className="h-8 w-28 object-contain" />
          ) : (
            <span className="font-black tracking-[0.2em]">{captchaText}</span>
          )}
        </button>
      </div>
      {captchaFails >= 3 && (
        <div className="text-[10px] text-[#ff6fb1]">
          连续输错多次，请刷新验证码后再试
        </div>
      )}
      {captchaLockUntil > Date.now() && (
        <div className="text-[10px] text-[#ff6fb1]">
          请稍后再试（约 {Math.ceil((captchaLockUntil - Date.now()) / 1000)} 秒）
        </div>
      )}
    </>
  );
};

export default CaptchaBox;
