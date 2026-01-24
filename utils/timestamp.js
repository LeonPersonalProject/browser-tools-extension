// 时间戳转换模块
export const timestamp = {
  // 判断是秒还是毫秒时间戳
  detectTimestampType(ts) {
    const num = parseInt(ts);
    return num > 10000000000 ? 'ms' : 's';
  },

  // 时间戳转时间
  timestampToDate(ts) {
    try {
      const num = parseInt(ts);
      if (isNaN(num)) {
        return { success: false, error: '无效的时间戳' };
      }

      const type = this.detectTimestampType(ts);
      const date = type === 'ms' ? new Date(num) : new Date(num * 1000);

      if (isNaN(date.getTime())) {
        return { success: false, error: '无效的时间戳' };
      }

      const localTime = this.formatDateTime(date);
      const utcTime = this.formatDateTime(date, true);
      const timestampSec = Math.floor(date.getTime() / 1000);
      const timestampMs = date.getTime();

      return {
        success: true,
        localTime,
        utcTime,
        timestampSec,
        timestampMs
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 日期时间转时间戳
  dateToTimestamp(dateString) {
    try {
      // 支持多种格式
      let date;

      // 尝试 ISO 格式
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // 尝试 YYYY-MM-DD HH:mm:ss 格式
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          date = new Date(parts[1], parts[2] - 1, parts[3], parts[4], parts[5], parts[6]);
        } else {
          date = new Date(dateString);
        }
      }

      if (isNaN(date.getTime())) {
        return { success: false, error: '无效的日期格式' };
      }

      const localTime = this.formatDateTime(date);
      const utcTime = this.formatDateTime(date, true);
      const timestampSec = Math.floor(date.getTime() / 1000);
      const timestampMs = date.getTime();

      return {
        success: true,
        localTime,
        utcTime,
        timestampSec,
        timestampMs
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 格式化日期时间
  formatDateTime(date, isUTC = false) {
    const year = isUTC ? date.getUTCFullYear() : date.getFullYear();
    const month = String(isUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1).padStart(2, '0');
    const day = String(isUTC ? date.getUTCDate() : date.getDate()).padStart(2, '0');
    const hours = String(isUTC ? date.getUTCHours() : date.getHours()).padStart(2, '0');
    const minutes = String(isUTC ? date.getUTCMinutes() : date.getMinutes()).padStart(2, '0');
    const seconds = String(isUTC ? date.getUTCSeconds() : date.getSeconds()).padStart(2, '0');

    const timezone = isUTC ? 'UTC' : `UTC${this.getTimezoneOffset()}`;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${timezone})`;
  },

  // 获取时区偏移
  getTimezoneOffset() {
    const offset = -new Date().getTimezoneOffset() / 60;
    return offset >= 0 ? `+${offset}` : offset;
  },

  // 获取当前时间戳
  getCurrentTimestamp() {
    const now = new Date();
    return {
      timestampSec: Math.floor(now.getTime() / 1000),
      timestampMs: now.getTime()
    };
  }
};
