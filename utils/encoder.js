function safe(operation) {
  try { return { success: true, result: operation() }; }
  catch (error) { return { success: false, error: error.message || '转换失败，请检查输入。' }; }
}
function encode64(text, url = false) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const result = btoa(binary);
  return url ? result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : result;
}
function decode64(text, url = false) {
  let value = text.replace(/\s/g, '');
  const pattern = url ? /^[\w-]*={0,2}$/ : /^[A-Za-z\d+/]*={0,2}$/;
  if (!pattern.test(value) || value.length % 4 === 1 || (value.includes('=') && value.length % 4 !== 0)) throw new Error('无效的 Base64 字符串。');
  if (url) value = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(value);
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}
export const encoder = {
  base64Encode: text => safe(() => encode64(text)),
  base64Decode: text => safe(() => decode64(text)),
  urlEncode: text => safe(() => encodeURIComponent(text)),
  urlDecode: text => safe(() => decodeURIComponent(text)),
  htmlEncode: text => safe(() => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])),
  htmlDecode: text => safe(() => {
    // 只解码实体，原始标签一律视为文本，避免创建资源节点或执行用户输入。
    const doc = new DOMParser().parseFromString('<!doctype html><body>' + text.replace(/</g, '&lt;'), 'text/html');
    return doc.body.textContent;
  }),
  unicodeEncode: text => safe(() => text.replace(/[^\x00-\x7f]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))),
  unicodeDecode: text => safe(() => {
    if (/\\u(?![\da-f]{4})/i.test(text)) throw new Error('Unicode 转义应为 \\u 加四位十六进制字符。');
    return text.replace(/\\u([\da-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }),
  parseJwt(text) {
    return safe(() => {
      const parts = text.trim().split('.');
      if (parts.length !== 3 || !parts[0] || !parts[1] || !/^[\w-]*$/.test(parts[2])) throw new Error('JWT 应包含以点分隔的 Header、Payload、Signature 三段。');
      const header = JSON.parse(decode64(parts[0], true));
      const payload = JSON.parse(decode64(parts[1], true));
      if (!header || typeof header !== 'object' || Array.isArray(header) || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('JWT Header 和 Payload 必须是 JSON 对象。');
      return JSON.stringify({ header, payload, signatureVerified: false }, null, 2);
    });
  },
  encode(type, text) {
    if (type === 'base64url') return safe(() => encode64(text, true));
    if (type === 'jwt') return this.parseJwt(text);
    return this[type + 'Encode']?.(text) || { success: false, error: '不支持的编码方式。' };
  },
  decode(type, text) {
    if (type === 'base64url') return safe(() => decode64(text, true));
    if (type === 'jwt') return this.parseJwt(text);
    return this[type + 'Decode']?.(text) || { success: false, error: '不支持的解码方式。' };
  }
};
