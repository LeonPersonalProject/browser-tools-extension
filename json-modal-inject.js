// JSON 大窗口 - 注入到页面的脚本
// 此脚本会被注入到当前浏览器标签页，创建一个覆盖整个浏览器视口的大窗口

(function() {
  'use strict';

  // 避免重复注入
  if (window.__jsonModalInjected) {
    console.log('JSON 大窗口已经注入，移除旧的');
    const oldOverlay = document.getElementById('json-modal-overlay-inject');
    if (oldOverlay) {
      oldOverlay.remove();
    }
  }
  window.__jsonModalInjected = true;

  // JSON 格式化工具
  const jsonFormatter = {
    // 预处理：支持 Python 字典格式
    preprocess(text) {
      return text
        .replace(/'/g, '"')           // 单引号 → 双引号
        .replace(/\bTrue\b/g, 'true') // Python True → JSON true
        .replace(/\bFalse\b/g, 'false') // Python False → JSON false
        .replace(/\bNone\b/g, 'null'); // Python None → JSON null
    },

    format(text) {
      try {
        const processed = this.preprocess(text);
        const obj = JSON.parse(processed);
        return { success: true, result: JSON.stringify(obj, null, 2) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    compress(text) {
      try {
        const processed = this.preprocess(text);
        const obj = JSON.parse(processed);
        return { success: true, result: JSON.stringify(obj) };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    highlight(json) {
      return json
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: (null)/g, ': <span class="json-null">$1</span>');
    },

    // 生成可折叠的 JSON 树
    renderCollapsible(data, level = 0) {
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
          html += this.renderCollapsible(item, level + 1);
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
          html += '<div class="json-line">';
          html += '<span class="json-indent">' + '  '.repeat(level + 1) + '</span>';
          html += `<span class="json-key">"${this.escapeHtml(key)}"</span>`;
          html += '<span class="json-colon">: </span>';
          html += this.renderCollapsible(data[key], level + 1);
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

  // Toast 提示
  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'json-modal-toast-inject';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 240);
    }, 2000);
  }

  // 复制到剪贴板
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板');
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('已复制到剪贴板');
    }
  }

  // 创建 SVG 图标
  function createSVG(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.innerHTML = path;
    return svg;
  }

  // 创建大窗口 HTML
  const overlay = document.createElement('div');
  overlay.id = 'json-modal-overlay-inject';
  overlay.className = 'json-modal-overlay-inject';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'json-modal-title-inject');

  overlay.innerHTML = `
    <div class="json-modal-container-inject">
      <div class="json-modal-header-inject">
        <div class="json-modal-title-inject">
          <span class="json-modal-icon-inject" aria-hidden="true">{ }</span>
          <h2 id="json-modal-title-inject">JSON 查看器</h2>
          <span class="json-modal-subtitle-inject">支持 Python 字典格式</span>
        </div>
        <div class="json-modal-actions-inject">
          <button id="json-modal-format-btn-inject" class="json-modal-btn-inject primary">
            格式化
          </button>
          <button id="json-modal-compress-btn-inject" class="json-modal-btn-inject primary">
            压缩
          </button>
          <button id="json-modal-expand-all-inject" class="json-modal-btn-inject" style="display: none;">
            全部展开
          </button>
          <button id="json-modal-collapse-all-inject" class="json-modal-btn-inject" style="display: none;">
            全部收缩
          </button>
          <button id="json-modal-copy-btn-inject" class="json-modal-btn-inject">
            复制
          </button>
          <button id="json-modal-clear-btn-inject" class="json-modal-btn-inject">
            清空
          </button>
          <button id="json-modal-close-btn-inject" class="json-modal-btn-inject close">
            关闭
          </button>
        </div>
      </div>
      <div class="json-modal-content-inject">
        <div class="json-modal-panel-inject">
          <div class="json-modal-panel-header-inject">输入 JSON</div>
          <textarea id="json-modal-input-inject" class="json-modal-textarea-inject" placeholder="粘贴 JSON 字符串...

支持格式：
• 标准 JSON
• Python 字典（单引号）
• Python 布尔值（True/False）
• Python None"></textarea>
        </div>
        <div class="json-modal-panel-inject">
          <div class="json-modal-panel-header-inject">格式化结果</div>
          <div id="json-modal-output-inject" class="json-modal-output-inject">等待格式化...</div>
        </div>
      </div>
      <div id="json-modal-error-msg-inject" class="json-modal-error-inject" role="alert"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 获取元素
  const modalInput = document.getElementById('json-modal-input-inject');
  const modalOutput = document.getElementById('json-modal-output-inject');
  const modalError = document.getElementById('json-modal-error-msg-inject');
  const formatBtn = document.getElementById('json-modal-format-btn-inject');
  const compressBtn = document.getElementById('json-modal-compress-btn-inject');
  const copyBtn = document.getElementById('json-modal-copy-btn-inject');
  const clearBtn = document.getElementById('json-modal-clear-btn-inject');
  const closeBtn = document.getElementById('json-modal-close-btn-inject');
  const expandAllBtn = document.getElementById('json-modal-expand-all-inject');
  const collapseAllBtn = document.getElementById('json-modal-collapse-all-inject');

  let lastFormattedJson = '';

  // 从扩展接收数据
  if (window.__jsonModalData) {
    modalInput.value = window.__jsonModalData.input || '';
    if (window.__jsonModalData.formatted) {
      lastFormattedJson = window.__jsonModalData.formatted;
      try {
        const parsed = JSON.parse(lastFormattedJson);
        modalOutput.innerHTML = jsonFormatter.renderCollapsible(parsed);
        // 显示展开/收缩按钮
        expandAllBtn.style.display = 'inline-flex';
        collapseAllBtn.style.display = 'inline-flex';
      } catch (e) {
        modalOutput.innerHTML = jsonFormatter.highlight(lastFormattedJson);
      }
    }
  }

  // 使用事件委托绑定折叠/展开事件
  modalOutput.addEventListener('click', (e) => {
    const toggle = e.target.closest('.json-toggle');
    if (!toggle) return;

    e.stopPropagation();
    e.preventDefault();

    const targetId = toggle.getAttribute('data-target');
    const content = document.getElementById(targetId);

    if (content) {
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '-';
      } else {
        content.style.display = 'none';
        toggle.textContent = '+';
      }
    }
  });

  // 格式化按钮
  formatBtn.addEventListener('click', () => {
    const text = modalInput.value.trim();
    if (!text) {
      modalError.textContent = '请输入 JSON 字符串';
      modalError.classList.add('show');
      setTimeout(() => modalError.classList.remove('show'), 3000);
      return;
    }

    const result = jsonFormatter.format(text);
    if (result.success) {
      lastFormattedJson = result.result;
      try {
        const parsed = JSON.parse(result.result);
        modalOutput.innerHTML = jsonFormatter.renderCollapsible(parsed);
        // 显示展开/收缩按钮
        expandAllBtn.style.display = 'inline-flex';
        collapseAllBtn.style.display = 'inline-flex';
      } catch (e) {
        modalOutput.innerHTML = jsonFormatter.highlight(result.result);
        expandAllBtn.style.display = 'none';
        collapseAllBtn.style.display = 'none';
      }
      modalError.classList.remove('show');
      showToast('格式化成功');
    } else {
      modalError.textContent = '格式化失败：' + result.error;
      modalError.classList.add('show');
      modalOutput.textContent = '格式化失败，请检查 JSON 格式';
      lastFormattedJson = '';
      expandAllBtn.style.display = 'none';
      collapseAllBtn.style.display = 'none';
    }
  });

  // 压缩按钮
  compressBtn.addEventListener('click', () => {
    const text = modalInput.value.trim();
    if (!text) {
      modalError.textContent = '请输入 JSON 字符串';
      modalError.classList.add('show');
      setTimeout(() => modalError.classList.remove('show'), 3000);
      return;
    }

    const result = jsonFormatter.compress(text);
    if (result.success) {
      lastFormattedJson = result.result;
      modalOutput.textContent = result.result;
      modalError.classList.remove('show');
      showToast('压缩成功');
      // 隐藏展开/收缩按钮
      expandAllBtn.style.display = 'none';
      collapseAllBtn.style.display = 'none';
    } else {
      modalError.textContent = '压缩失败：' + result.error;
      modalError.classList.add('show');
      modalOutput.textContent = '压缩失败，请检查 JSON 格式';
      lastFormattedJson = '';
      expandAllBtn.style.display = 'none';
      collapseAllBtn.style.display = 'none';
    }
  });

  // 全部展开
  expandAllBtn.addEventListener('click', () => {
    const contents = modalOutput.querySelectorAll('.json-content');
    const toggles = modalOutput.querySelectorAll('.json-toggle');

    contents.forEach(content => {
      content.style.display = 'block';
    });

    toggles.forEach(toggle => {
      toggle.textContent = '-';
    });
    showToast('已全部展开');
  });

  // 全部收缩
  collapseAllBtn.addEventListener('click', () => {
    const contents = modalOutput.querySelectorAll('.json-content');
    const toggles = modalOutput.querySelectorAll('.json-toggle');

    contents.forEach(content => {
      content.style.display = 'none';
    });

    toggles.forEach(toggle => {
      toggle.textContent = '+';
    });
    showToast('已全部收缩');
  });

  // 复制按钮
  copyBtn.addEventListener('click', () => {
    if (!lastFormattedJson) {
      showToast('请先格式化或压缩 JSON');
      return;
    }
    copyToClipboard(lastFormattedJson);
  });

  // 清空按钮
  clearBtn.addEventListener('click', () => {
    modalInput.value = '';
    modalOutput.textContent = '等待格式化...';
    modalError.classList.remove('show');
    lastFormattedJson = '';
    expandAllBtn.style.display = 'none';
    collapseAllBtn.style.display = 'none';
    showToast('已清空');
  });

  // 关闭按钮
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    window.__jsonModalInjected = false;
  });

  // 点击遮罩层关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      window.__jsonModalInjected = false;
    }
  });

  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.parentElement) {
      overlay.remove();
      window.__jsonModalInjected = false;
    }
  });

  // 点击输出区域复制（但不包括折叠按钮）
  modalOutput.addEventListener('click', (e) => {
    // 如果点击的是折叠按钮或其子元素，不执行复制
    if (e.target.closest('.json-toggle')) {
      return;
    }

    if (lastFormattedJson) {
      copyToClipboard(lastFormattedJson);
    }
  });

  console.log('✅ JSON 大窗口已注入到页面（覆盖 90% 浏览器视口）');
})();
