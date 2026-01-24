// 编码/解密工具模块
export const encoder = {
  // Base64 编码
  base64Encode(str) {
    try {
      return { success: true, result: btoa(unescape(encodeURIComponent(str))) };
    } catch (error) {
      return { success: false, error: '编码失败：' + error.message };
    }
  },

  // Base64 解码
  base64Decode(str) {
    try {
      return { success: true, result: decodeURIComponent(escape(atob(str))) };
    } catch (error) {
      return { success: false, error: '解码失败：无效的 Base64 字符串' };
    }
  },

  // URL 编码
  urlEncode(str) {
    try {
      return { success: true, result: encodeURIComponent(str) };
    } catch (error) {
      return { success: false, error: '编码失败：' + error.message };
    }
  },

  // URL 解码
  urlDecode(str) {
    try {
      return { success: true, result: decodeURIComponent(str) };
    } catch (error) {
      return { success: false, error: '解码失败：无效的 URL 编码字符串' };
    }
  },

  // HTML 实体编码
  htmlEncode(str) {
    try {
      const div = document.createElement('div');
      div.textContent = str;
      return { success: true, result: div.innerHTML };
    } catch (error) {
      return { success: false, error: '编码失败：' + error.message };
    }
  },

  // HTML 实体解码
  htmlDecode(str) {
    try {
      const div = document.createElement('div');
      div.innerHTML = str;
      return { success: true, result: div.textContent };
    } catch (error) {
      return { success: false, error: '解码失败：' + error.message };
    }
  },

  // Unicode 转义编码
  unicodeEncode(str) {
    try {
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code > 127) {
          result += '\\u' + code.toString(16).padStart(4, '0');
        } else {
          result += str[i];
        }
      }
      return { success: true, result };
    } catch (error) {
      return { success: false, error: '编码失败：' + error.message };
    }
  },

  // Unicode 转义解码
  unicodeDecode(str) {
    try {
      const result = str.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, error: '解码失败：' + error.message };
    }
  },

  // 统一编码接口
  encode(type, str) {
    switch (type) {
      case 'base64':
        return this.base64Encode(str);
      case 'url':
        return this.urlEncode(str);
      case 'html':
        return this.htmlEncode(str);
      case 'unicode':
        return this.unicodeEncode(str);
      default:
        return { success: false, error: '未知的编码类型' };
    }
  },

  // 统一解码接口
  decode(type, str) {
    switch (type) {
      case 'base64':
        return this.base64Decode(str);
      case 'url':
        return this.urlDecode(str);
      case 'html':
        return this.htmlDecode(str);
      case 'unicode':
        return this.unicodeDecode(str);
      default:
        return { success: false, error: '未知的解码类型' };
    }
  }
};
