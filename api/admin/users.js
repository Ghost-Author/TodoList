import { parsePositiveInt, requireAdmin, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const auth = requireAdmin(req, res, { method: 'GET', scope: 'users-read', limit: 120 });
  if (!auth) return;

  const { supabase, requestId } = auth;
  const page = parsePositiveInt(req.query.page, 1, 1, 10_000);
  const perPage = parsePositiveInt(req.query.per_page, 20, 1, 100);
  const query = String(req.query.q || '').trim().toLowerCase();

  const toView = (u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at
  });

  try {
    if (query) {
      const match = [];
      let scanPage = 1;
      const scanPerPage = 1000;

      while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({
          page: scanPage,
          perPage: scanPerPage
        });
        if (error) {
          return sendJson(res, 500, { error: error.message }, requestId);
        }

        const users = data?.users || [];
        match.push(...users.filter((u) => String(u.email || '').toLowerCase().includes(query)).map(toView));

        if (users.length < scanPerPage || scanPage >= 1000) break;
        scanPage += 1;
      }

      const from = (page - 1) * perPage;
      const users = match.slice(from, from + perPage);
      return sendJson(res, 200, {
        users,
        page,
        perPage,
        total: match.length,
        has_more: from + perPage < match.length,
        q: query
      }, requestId);
    }

    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      return sendJson(res, 500, { error: error.message }, requestId);
    }
    const users = (data?.users || []).map(toView);
    const total = Number.isFinite(data?.total) ? data.total : null;
    const hasMore = data?.nextPage != null || users.length >= perPage;
    return sendJson(res, 200, {
      users,
      page,
      perPage,
      total,
      has_more: hasMore
    }, requestId);
  } catch {
    return sendJson(res, 500, { error: 'Server error' }, requestId);
  }
}
