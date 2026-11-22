import type { H3Event } from 'h3'

export const INVALID_AUTHORIZATION_REQUEST =
    '<p style="margin:0;color:#555">授权请求无效，请回到客户端重新发起授权。</p>'

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}

export function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] || char)
}

/** 极简白底页面：授权同意、登录提示与错误都复用它。 */
export function renderOAuthPage(event: H3Event, status: number, title: string, body: string) {
    setResponseStatus(event, status)
    setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
    setHeader(event, 'Cache-Control', 'no-store')
    setHeader(event, 'X-Frame-Options', 'DENY')
    return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:48px 24px;background:#fff;color:#111;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<main style="max-width:400px;margin:0 auto">${body}</main>
</body>
</html>`
}

/** OAuth 端点错误统一按 RFC 6749 的 {error, error_description} 返回。 */
export function oauthError(event: H3Event, status: number, error: string, description: string) {
    setResponseStatus(event, status)
    setHeader(event, 'Cache-Control', 'no-store')
    return { error, error_description: description }
}
