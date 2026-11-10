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
    mountTree(container, data, copy) {
      container.replaceChildren();
      const node = (value, path, key, depth) => {
        const row = document.createElement('div');
        row.className = 'tree-row';
        const label = document.createElement('button');
        label.type = 'button'; label.className = 'text-button';
        label.textContent = key + ' ⧉'; label.title = '复制 JSON Pointer：' + (path || '（根路径为空）');
        label.addEventListener('click', () => copy(path || ''));
        row.append(label);
        if (value === null || typeof value !== 'object') {
          const text = document.createElement('span'); text.textContent = ': ' + JSON.stringify(value); row.append(text);
          return row;
        }
        const detail = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = (Array.isArray(value) ? '数组' : '对象') + ' · ' + Object.keys(value).length + ' 项';
        detail.append(summary);
        let loaded = false;
        detail.addEventListener('toggle', () => { if (detail.open) detail.loadChildren(); });
        detail.loadChildren = () => {
          if (loaded) return;
          loaded = true;
          if (depth >= 60) { const note = document.createElement('span'); note.textContent = '深度超过 60，请使用代码视图'; detail.append(note); return; }
          const keys = Object.keys(value);
          let offset = 0;
          const more = document.createElement('button'); more.type = 'button'; more.className = 'text-button';
          more.textContent = '加载后续 100 项';
          const batch = () => {
            const end = Math.min(offset + 100, keys.length);
            while (offset < end) {
              const childKey = keys[offset++];
              const pointer = path + '/' + childKey.replace(/~/g, '~0').replace(/\//g, '~1');
              detail.append(node(value[childKey], pointer, childKey, depth + 1));
            }
            if (offset < keys.length) detail.append(more); else more.remove();
          };
          more.addEventListener('click', batch); batch();
        };
        row.append(detail); return row;
      };
      container.append(node(data, '', '$', 0));
      container.querySelector('details')?.setAttribute('open', '');
    },
    toggleTree(container, open) {
      let processed = 0;
      if (!open) { container.querySelectorAll('details').forEach(detail => { detail.open = false; }); return true; }
      const queue = [...container.querySelectorAll('details')];
      while (queue.length && processed < 2000) {
        const detail = queue.shift();
        detail.open = true; detail.loadChildren?.(); processed++;
        queue.push(...[...detail.children].flatMap(child => child.classList.contains('tree-row') ? [...child.children].filter(el => el.tagName === 'DETAILS') : []));
      }
      return !queue.length && ![...container.querySelectorAll('button')].some(button => button.textContent === '加载后续 100 项');
    },
    parse(text) {
      try { return JSON.parse(text); }
      catch (original) {
        try { return JSON.parse(pythonToJson(text)); }
        catch { throw original; }
      }
    },
    format(text, indent = 2, sort = false) {
      try {
        if (new Blob([text]).size > 5 * 1024 * 1024) throw new Error('输入上限为 5 MiB。');
        let parsed = this.parse(text);
        if (sort) parsed = sortKeys(parsed);
        return { success: true, parsed, result: JSON.stringify(parsed, null, indent) };
      } catch (e) {
        if (!(e instanceof SyntaxError)) return { success: false, error: e.message };
        const position = e.message.match(/position (\d+)/i);
        const lineMatch = e.message.match(/line (\d+) column (\d+)/i);
        const reported = !!(position || lineMatch);
        let index = position ? Number(position[1]) : text.length;
        if (!position && lineMatch) index = text.split('\n').slice(0, Number(lineMatch[1]) - 1).reduce((sum, line) => sum + line.length + 1, 0) + Number(lineMatch[2]) - 1;
        index = Math.max(0, Math.min(index, text.length));
        const prefix = text.slice(0, index);
        const line = prefix.split('\n').length;
        const column = prefix.length - prefix.lastIndexOf('\n');
        const location = '（第 ' + line + ' 行，第 ' + column + ' 列' + (reported ? '；解析器报告位置' : '；输入末尾参考位置，解析器未提供准确位置') + '）';
        return { success: false, line, column, position: index, locationExact: reported, error: e.message + location + '\n附近：' + text.slice(Math.max(0, index - 60), index) + ' ⟵ ' + text.slice(index, index + 60) };
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
    preview(value) {
      if (value !== null && typeof value === 'object') return (Array.isArray(value) ? '数组' : '对象') + ' · ' + Object.keys(value).length + ' 项（使用路径或树查看内容）';
      return JSON.stringify(typeof value === 'string' ? value.slice(0, 1000) : value);
    },
    searchText(data, query) {
      if (!query.trim()) return '输入键名、点路径或 JSON Pointer 开始查找。';
      const matches = this.search(data, query);
      return (matches.length ? matches.map(match => match.path + '\n' + this.preview(match.value)).join('\n\n') : '没有找到匹配的键或路径。') + '\n最多展示 100 条；最多扫描 100000 个键或数组项；长字符串仅预览前 1000 字符。';
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
      let visited = 0;
      const stack = [{ value: data, path: '' }];
      while (stack.length && matches.length < 100 && visited < 100000) {
        const { value, path } = stack.pop();
        if (value === null || typeof value !== 'object') continue;
        for (const key in value) {
          if (!Object.hasOwn(value, key)) continue;
          if (visited++ >= 100000) break;
          const child = value[key];
          const childPath = path + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1');
          if (key.toLocaleLowerCase().includes(query.toLocaleLowerCase())) matches.push({ path: childPath, value: child });
          if (child !== null && typeof child === 'object') stack.push({ value: child, path: childPath });
          if (matches.length >= 100) break;
        }
      }
      return matches;
    }
  };

  globalThis.__candyJsonFormatter = jsonFormatter;
})();
