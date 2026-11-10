const maxDate = 8640000000000000;
const zoneName = zone => zone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone;
function utcCivil(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
  date.setUTCHours(parts[3], parts[4], parts[5], parts[6] || 0);
  return date;
}
function civilParts(date, zone) {
  const parts = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
    timeZone: zoneName(zone), era: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  if (map.era === 'BC') map.year = 1 - Number(map.year);
  return ['year', 'month', 'day', 'hour', 'minute', 'second'].map(key => Number(map[key]));
}
export const timestamp = {
  detectTimestampType(value) { return Math.abs(Number(value)) >= 100000000000 ? 'ms' : 's'; },
  fromMilliseconds(ms, zone = 'local') {
    if (!Number.isSafeInteger(ms) || Math.abs(ms) > maxDate) return { success: false, error: '日期超出可表示范围。' };
    try {
      const date = new Date(ms);
      return {
        success: true, localTime: this.formatDateTime(date, zone), utcTime: this.formatDateTime(date, 'UTC'),
        iso: date.toISOString(), timestampSec: Math.floor(ms / 1000), timestampMs: ms
      };
    } catch (error) { return { success: false, error: error.message }; }
  },
  timestampToDate(value, unit = 'auto', zone = 'local') {
    const text = String(value).trim();
    if (!/^[+-]?\d+$/.test(text)) return { success: false, error: '请输入完整整数时间戳，不包含小数或其他字符。' };
    const number = Number(text);
    if (!Number.isSafeInteger(number)) return { success: false, error: '时间戳超出安全整数范围。' };
    const detected = unit === 'auto' ? this.detectTimestampType(number) : unit;
    const result = this.fromMilliseconds(number * (detected === 's' ? 1000 : 1), zone);
    return { ...result, unit: detected };
  },
  dateToTimestamp(value, zone = 'local') {
    const text = value.trim();
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/i);
    if (!match) return { success: false, error: '使用 YYYY-MM-DD HH:mm:ss，可带毫秒或 Z / ±HH:mm。' };
    const parts = match.slice(1, 7).map(part => Number(part || 0));
    parts.push(Number((match[7] || '').padEnd(3, '0')));
    const civil = utcCivil(parts);
    const actual = [civil.getUTCFullYear(), civil.getUTCMonth() + 1, civil.getUTCDate(), civil.getUTCHours(), civil.getUTCMinutes(), civil.getUTCSeconds()];
    if (parts[0] < 1 || actual.some((part, i) => part !== parts[i])) return { success: false, error: '日期或时间无效，请检查月份、天数与时分秒。' };
    const offset = match[8];
    if (offset) {
      let minutes = 0;
      if (offset.toUpperCase() !== 'Z') {
        const hours = Number(offset.slice(1, 3));
        const mins = Number(offset.slice(4));
        if (hours > 23 || mins > 59) return { success: false, error: '无效的时区偏移。' };
        minutes = (hours * 60 + mins) * (offset[0] === '-' ? -1 : 1);
      }
      return this.fromMilliseconds(civil.getTime() - minutes * 60000, zone);
    }
    try {
      // 收集转换日期附近的时区偏移，并回验本地时刻；拒绝 DST 跳跃和重复时间。
      const offsets = new Set();
      for (let hour = -36; hour <= 36; hour += 6) {
        const sample = new Date(civil.getTime() + hour * 3600000);
        const local = civilParts(sample, zone);
        offsets.add(utcCivil([...local, sample.getUTCMilliseconds()]).getTime() - sample.getTime());
      }
      const candidates = [...offsets].map(diff => civil.getTime() - diff).filter(ms => civilParts(new Date(ms), zone).every((part, i) => part === parts[i]));
      if (candidates.length !== 1) return {
        success: false,
        error: candidates.length ? '该时刻因夏令时出现两次，请附上明确偏移，如 -04:00 或 -05:00。' : '该时区中不存在此时刻（可能处于夏令时跳跃），请调整时间。'
      };
      return this.fromMilliseconds(candidates[0], zone);
    } catch (error) { return { success: false, error: '无法解析所选时区：' + error.message }; }
  },
  formatDateTime(date, zone = 'local') {
    if (zone === true) zone = 'UTC';
    if (zone === false) zone = 'local';
    const parts = civilParts(date, zone);
    const formatted = String(parts[0]).padStart(4, '0') + '-' + parts.slice(1, 3).map(part => String(part).padStart(2, '0')).join('-') + ' ' + parts.slice(3).map(part => String(part).padStart(2, '0')).join(':');
    const offset = new Intl.DateTimeFormat('en', { timeZone: zoneName(zone), timeZoneName: 'longOffset' }).formatToParts(date).find(part => part.type === 'timeZoneName').value;
    return formatted + ' (' + offset.replace('GMT', 'UTC') + ')';
  },
  getCurrentTimestamp() { const now = Date.now(); return { timestampSec: Math.floor(now / 1000), timestampMs: now }; }
};
