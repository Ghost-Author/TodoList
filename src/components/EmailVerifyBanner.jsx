import React from 'react';

const EmailVerifyBanner = ({ show }) => {
  if (!show) return null;
  return (
    <div className="card-soft-sm px-4 py-3 mb-6 text-sm text-[#7b6f8c]">
      你的邮箱尚未验证，请前往邮箱完成验证以确保账号安全。
    </div>
  );
};

export default EmailVerifyBanner;
