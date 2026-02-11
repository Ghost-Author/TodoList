import { isValidUuid, parsePositiveInt, requireAdmin, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'audit-read', limit: 120 });
  if (!auth) return;

  const { supabase, requestId } = auth;
  const page = parsePositiveInt(req.query.page, 1, 1, 10_000);
  const perPage = parsePositiveInt(req.query.per_page, 20, 1, 100);
  const query = String(req.query.q || '').trim();
  const safeQuery = query.replace(/[,\(\)]/g, ' ').trim();
  const like = `%${safeQuery}%`;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  try {
    let builder = supabase
      .from('admin_audit')
      .select('id, admin_email, action, target_user_id, detail, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (safeQuery) {
      const parts = [
        `admin_email.ilike.${like}`,
        `action.ilike.${like}`,
        `detail->>reason.ilike.${like}`,
        `detail->>email.ilike.${like}`
      ];
      if (isValidUuid(safeQuery)) {
        parts.push(`target_user_id.eq.${safeQuery}`);
      }
      builder = builder.or(parts.join(','));
    }

    const { data, error, count } = await builder;
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }
    const logs = data || [];
    const total = Number.isFinite(count) ? count : null;
    const hasMore = Number.isFinite(total) ? page * perPage < total : logs.length === perPage;
    return sendJson(res, 200, {
      logs,
      page,
      perPage,
      total,
      has_more: hasMore,
      q: safeQuery
    }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
