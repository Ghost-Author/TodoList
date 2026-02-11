import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET;

const RATE_LIMIT_BUCKETS = new Map();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeCompare = (left, right) => {
  const leftBuf = Buffer.from(left || '');
  const rightBuf = Buffer.from(right || '');
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

const applyRateLimit = (key, maxRequests, windowMs) => {
  const now = Date.now();
  const bucket = RATE_LIMIT_BUCKETS.get(key);
  if (!bucket || bucket.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count += 1;
  RATE_LIMIT_BUCKETS.set(key, bucket);
  return true;
};

const createRequestId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
};

export const sendJson = (res, status, payload, requestId) => {
  if (requestId) {
    res.setHeader('x-request-id', requestId);
  }
  return res.status(status).json({
    ...payload,
    ...(requestId ? { request_id: requestId } : {})
  });
};

export const parsePositiveInt = (value, defaultValue, min = 1, max = 100) => {
  const parsed = Number.parseInt(String(value ?? defaultValue), 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, min), max);
};

export const isValidUuid = (value) => UUID_RE.test(String(value || ''));
export const isValidEmail = (value) => EMAIL_RE.test(String(value || ''));

export const requireAdmin = (req, res, options = {}) => {
  const requestId = createRequestId();
  res.setHeader('x-request-id', requestId);

  const {
    method,
    limit = 90,
    windowMs = 60_000,
    scope = 'default'
  } = options;

  if (method && req.method !== method) {
    sendJson(res, 405, { error: 'Method not allowed' }, requestId);
    return null;
  }

  if (!supabaseUrl || !serviceRoleKey || !adminSecret) {
    sendJson(res, 500, { error: 'Server missing admin credentials' }, requestId);
    return null;
  }

  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  if (!applyRateLimit(key, limit, windowMs)) {
    sendJson(res, 429, { error: 'Too many requests' }, requestId);
    return null;
  }

  const incomingSecret = String(req.headers['x-admin-secret'] || '');
  if (!safeCompare(incomingSecret, adminSecret)) {
    sendJson(res, 401, { error: 'Unauthorized' }, requestId);
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  return {
    supabase,
    requestId,
    actor: {
      ip,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 200)
    }
  };
};

export const writeAdminAudit = async (supabase, actor, payload) => {
  const { action, targetUserId = null, detail = {} } = payload;
  return supabase.from('admin_audit').insert({
    admin_email: null,
    action,
    target_user_id: targetUserId,
    detail: {
      ...detail,
      actor_ip: actor?.ip || 'unknown',
      user_agent: actor?.userAgent || ''
    }
  });
};

export const countAllUsers = async (supabase) => {
  const perPage = 1000;
  let page = 1;
  let total = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) return { error };
    const users = data?.users || [];
    total += users.length;
    if (users.length < perPage) break;
    page += 1;
    if (page > 1000) break;
  }

  return { count: total };
};
