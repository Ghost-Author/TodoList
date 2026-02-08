import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleAuth = async ({ email, password, captchaOk, onCaptchaFail, onCaptchaUsed }) => {
    setAuthError('');
    if (!email.trim() || !password) {
      setAuthError('请输入邮箱和密码');
      return false;
    }
    if (!captchaOk) {
      setAuthError('验证码不正确');
      if (onCaptchaFail) onCaptchaFail();
      if (onCaptchaUsed) onCaptchaUsed();
      return false;
    }

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) {
          setAuthError(error.message);
          return false;
        }
        setAuthError('注册成功，请检查邮箱完成验证后登录');
        setAuthMode('signin');
        return true;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) {
        setAuthError(error.message);
        return false;
      }
      return true;
    } finally {
      if (onCaptchaUsed) onCaptchaUsed();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendResetEmail = async (email) => {
    setAuthError('');
    if (!email.trim()) {
      setAuthError('请输入邮箱以重置密码');
      return false;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    setAuthError('已发送重置邮件，请查收');
    return true;
  };

  const updatePassword = async (newPassword) => {
    setAuthError('');
    if (!newPassword) {
      setAuthError('请输入新密码');
      return false;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    setAuthError('密码已更新');
    setRecoveryMode(false);
    return true;
  };

  return {
    session,
    authLoading,
    authError,
    setAuthError,
    authMode,
    setAuthMode,
    recoveryMode,
    setRecoveryMode,
    handleAuth,
    signOut,
    sendResetEmail,
    updatePassword
  };
};
