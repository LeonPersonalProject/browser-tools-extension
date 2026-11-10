const prefixes = { 2: '0b', 8: '0o', 10: '', 16: '0x' };
const patterns = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[\da-f]+$/i };
export const converter = {
  toDecimal(value, base) {
    base = Number(base);
    let text = String(value).trim();
    const negative = text.startsWith('-');
    text = text.replace(/^[+-]/, '');
    if (prefixes[base] && text.slice(0, 2).toLowerCase() === prefixes[base]) text = text.slice(2);
    if (!patterns[base]?.test(text)) return { success: false, error: '请输入完整的' + base + '进制整数；不支持小数或不匹配的前缀。' };
    try {
      const num = BigInt(prefixes[base] + text);
      return { success: true, result: negative ? -num : num };
    } catch { return { success: false, error: '数值无法解析，请检查长度与进制。' }; }
  },
  isValidNumber(value, base) { return this.toDecimal(value, base).success; },
  fromDecimal(value, base, prefix = false, uppercase = true, group = false) {
    try {
      if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error();
      const num = BigInt(value);
      if (!Object.hasOwn(prefixes, base)) throw new Error();
      let text = (num < 0n ? -num : num).toString(Number(base));
      if (uppercase && Number(base) === 16) text = text.toUpperCase();
      if (group) {
        const size = Number(base) === 2 || Number(base) === 16 ? 4 : 3;
        text = text.replace(new RegExp('\\B(?=(?:.{'+ size + '})+$)', 'g'), ' ');
      }
      return { success: true, result: (num < 0n ? '-' : '') + (prefix ? prefixes[base] : '') + text };
    } catch { return { success: false, error: '无效的整数或进制' }; }
  },
  convert(value, from, to) {
    const parsed = this.toDecimal(value, from);
    return parsed.success ? this.fromDecimal(parsed.result, to) : parsed;
  },
  convertToAll(value, base, prefix = false, uppercase = true, group = false) {
    const parsed = this.toDecimal(value, base);
    if (!parsed.success) return parsed;
    return { success: true, results: Object.fromEntries([['binary', 2], ['octal', 8], ['decimal', 10], ['hexadecimal', 16]].map(([name, radix]) => [name, this.fromDecimal(parsed.result, radix, prefix, uppercase, group).result])) };
  }
};
