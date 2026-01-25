// JSON 格式化与校验模块
export const jsonFormatter = {
  // 预处理：将单引号转换为双引号（处理 Python 字典格式）
  preprocessJson(jsonString) {
    // 移除首尾空白
    jsonString = jsonString.trim();

    // 尝试将单引号转换为双引号
    // 这个正则会匹配单引号包裹的字符串，但不会匹配字符串内部的单引号
    let processed = jsonString.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

    // 处理 Python 的 True/False/None 转换为 JSON 的 true/false/null
    processed = processed.replace(/\bTrue\b/g, 'true');
    processed = processed.replace(/\bFalse\b/g, 'false');
    processed = processed.replace(/\bNone\b/g, 'null');

    return processed;
  },

  // 格式化 JSON
  format(jsonString) {
    try {
      // 先预处理
      const processed = this.preprocessJson(jsonString);
      const parsed = JSON.parse(processed);
      const formatted = JSON.stringify(parsed, null, 2);
      return { success: true, result: formatted, parsed };
    } catch (error) {
      // 如果预处理后仍然失败，尝试直接解析原始字符串
      try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
        return { success: true, result: formatted, parsed };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  },

  // 压缩 JSON
  compress(jsonString) {
    try {
      // 先预处理
      const processed = this.preprocessJson(jsonString);
      const parsed = JSON.parse(processed);
      const compressed = JSON.stringify(parsed);
      return { success: true, result: compressed };
    } catch (error) {
      // 如果预处理后仍然失败，尝试直接解析原始字符串
      try {
        const parsed = JSON.parse(jsonString);
        const compressed = JSON.stringify(parsed);
        return { success: true, result: compressed };
      } catch (e) {
        return { success: false, error: error.message };
      }
    }
  },

  // 语法高亮
  highlight(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return this.syntaxHighlight(parsed);
    } catch (error) {
      return jsonString;
    }
  },

  // 递归高亮 JSON
  syntaxHighlight(json) {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }

    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return json.replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^\"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  },

  // 生成可折叠的 JSON 树
  renderCollapsible(data, level = 0, isInline = false) {
    if (data === null) {
      return '<span class="json-null">null</span>';
    }

    const type = typeof data;

    if (type === 'boolean') {
      return `<span class="json-boolean">${data}</span>`;
    }

    if (type === 'number') {
      return `<span class="json-number">${data}</span>`;
    }

    if (type === 'string') {
      return `<span class="json-string">"${this.escapeHtml(data)}"</span>`;
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '<span class="json-bracket">[]</span>';
      }

      const id = 'json-' + Math.random().toString(36).substring(2, 11);
      let html = `<span class="json-collapsible">`;
      html += `<span class="json-toggle" data-target="${id}">-</span>`;
      html += `<span class="json-bracket">[</span>`;
      html += `<span class="json-count">${data.length} items</span>`;
      html += `<div class="json-content" id="${id}">`;

      data.forEach((item, index) => {
        html += '<div class="json-line">';
        html += '<span class="json-indent">' + '  '.repeat(level + 1) + '</span>';
        html += this.renderCollapsible(item, level + 1, false);
        if (index < data.length - 1) {
          html += '<span class="json-comma">,</span>';
        }
        html += '</div>';
      });

      html += '<div class="json-line">';
      html += '<span class="json-indent">' + '  '.repeat(level) + '</span>';
      html += '<span class="json-bracket">]</span>';
      html += '</div>';
      html += '</div>';
      html += '</span>';

      return html;
    }

    if (type === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return '<span class="json-bracket">{}</span>';
      }

      const id = 'json-' + Math.random().toString(36).substring(2, 11);
      let html = `<span class="json-collapsible">`;
      html += `<span class="json-toggle" data-target="${id}">-</span>`;
      html += `<span class="json-bracket">{</span>`;
      html += `<span class="json-count">${keys.length} keys</span>`;
      html += `<div class="json-content" id="${id}">`;

      keys.forEach((key, index) => {
        const value = data[key];
        const isComplexValue = (typeof value === 'object' && value !== null && (Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0));

        html += '<div class="json-line">';
        html += '<span class="json-indent">' + '  '.repeat(level + 1) + '</span>';
        html += `<span class="json-key">"${this.escapeHtml(key)}"</span>`;
        html += '<span class="json-colon">: </span>';
        html += this.renderCollapsible(value, level + 1, true);
        if (index < keys.length - 1) {
          html += '<span class="json-comma">,</span>';
        }
        html += '</div>';
      });

      html += '<div class="json-line">';
      html += '<span class="json-indent">' + '  '.repeat(level) + '</span>';
      html += '<span class="json-bracket">}</span>';
      html += '</div>';
      html += '</div>';
      html += '</span>';

      return html;
    }

    return String(data);
  },

  // HTML 转义
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
