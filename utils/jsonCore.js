(function() {
  'use strict';
  // 仅转换字符串外的 Python 字面量；不执行输入，不改写合法 JSON。
  function pythonToJson(text) {
    let result = '';
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let value = '';
        let closed = false;
        i++;
        while (i < text.length) {
          const char = text[i++];
          if (char === quote) { closed = true; break; }
          if (char !== '\\') { value += char; continue; }
          if (i >= text.length) throw new Error('字符串结尾的转义不完整');
          const escaped = text[i++];
          const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '\\': '\\', '/': '/', '"': '"', "'": "'" };
          if (Object.hasOwn(escapes, escaped)) value += escapes[escaped];
          else if (escaped === 'u') {
            const hex = text.slice(i, i + 4);
            if (!/^[a-f\d]{4}$/i.test(hex)) throw new Error('无效的 Unicode 转义');
            value += String.fromCharCode(parseInt(hex, 16));
            i += 4;
          } else throw new Error('不支持的转义：\\' + escaped);
        }
        if (!closed) throw new Error('字符串缺少结束引号');
        result += JSON.stringify(value);
      } else if (/[A-Za-z_]/.test(ch)) {
        const word = text.slice(i).match(/^[A-Za-z_][A-Za-z_\d]*/)[0];
        result += ({ True: 'true', False: 'false', None: 'null' })[word] || word;
        i += word.length;
      } else { result += ch; i++; }
    }
    return result;
  }
  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys(value[key])]));
    }
    return value;
  }
  const jsonFormatter = {
    preprocessJson: pythonToJson,
    parse(text) {
      try { return JSON.parse(text); }
      catch (original) {
        try { return JSON.parse(pythonToJson(text)); }
        catch { throw original; }
      }
    },
    format(text, indent = 2, sort = false) {
      try {
        let parsed = this.parse(text);
        if (sort) parsed = sortKeys(parsed);
        return { success: true, parsed, result: JSON.stringify(parsed, null, indent) };
      } catch (e) {
        const position = e.message.match(/position (\d+)/i);
        let location = '';
        if (position) {
          const prefix = text.slice(0, Number(position[1]));
          location = '（第 ' + prefix.split('\n').length + ' 行，第 ' + (prefix.length - prefix.lastIndexOf('\n')) + ' 列）';
        }
        return { success: false, error: e.message + location };
      }
    },
    compress(text, sort = false) { return this.format(text, 0, sort); },
    escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    },
    syntaxHighlight(value) {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      // 先分词再转义；输入数据不能成为 HTML。
      return text.split(/("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi).map(token => {
        const cls = token.startsWith('"') ? (/:$/.test(token) ? 'key' : 'string') : /^(true|false|null)$/.test(token) ? 'boolean' : /^-?\d/.test(token) ? 'number' : '';
        const safe = this.escapeHtml(token);
        return cls ? '<span class="json-' + cls + '">' + safe + '</span>' : safe;
      }).join('');
    },
    highlight(text) { return this.syntaxHighlight(text); },
    renderCollapsible(data, level = 0) {
      // 过深数据仍以可选文本显示，防止视图递归耗尽堆栈。
      if (level > 60) return this.escapeHtml(JSON.stringify(data));
      if (data === null || typeof data !== 'object') return this.syntaxHighlight(JSON.stringify(data));
      const array = Array.isArray(data);
      const entries = Object.entries(data);
      if (!entries.length) return array ? '[]' : '{}';
      return '<details' + (level < 2 ? ' open' : '') + '><summary>' + (array ? '[' : '{') + '<span class="json-count">' + entries.length + (array ? ' 项' : ' 个键') + '</span></summary>' + entries.map(([key, value]) => '<div class="tree-row"><span class="json-key">' + this.escapeHtml(array ? key : JSON.stringify(key)) + '</span>: ' + this.renderCollapsible(value, level + 1) + '</div>').join('') + (array ? ']' : '}') + '</details>';
    },
    search(data, query) {
      query = query.trim();
      if (!query) return [];
      let parts;
      if (query.startsWith('/')) parts = query.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
      else if (/[.\[]/.test(query)) {
        parts = query.replace(/\[(\d+)\]/g, '.$1').split('.');
        if (parts[0] === '$') parts.shift();
      }
      if (parts) {
        let value = data;
        for (const key of parts) {
          if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) return [];
          value = value[key];
        }
        return [{ path: query, value }];
      }
      const matches = [];
      const stack = [{ value: data, path: '' }];
      while (stack.length && matches.length < 100) {
        const { value, path } = stack.pop();
        if (value === null || typeof value !== 'object') continue;
        for (const [key, child] of Object.entries(value)) {
          const childPath = path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1');
          if (key.toLocaleLowerCase().includes(query.toLocaleLowerCase())) matches.push({ path: childPath, value: child });
          stack.push({ value: child, path: childPath });
          if (matches.length >= 100) break;
        }
      }
      return matches;
    }
  };

  globalThis.__candyJsonFormatter = jsonFormatter;
})();
