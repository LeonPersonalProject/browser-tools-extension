// Shadow DOM 隔离宿主样式；共享 JSON 核心在扩展 isolated world 中运行。
(function() {
  'use strict';
  globalThis.__candyModalClose?.();
  const data = globalThis.__candyModalData;
  delete globalThis.__candyModalData;
  const formatter = globalThis.__candyJsonFormatter;
  if (!data || !formatter) return;
  const previousFocus = document.activeElement;
  const host = document.createElement('div');
  host.id = 'candy-json-modal';
  host.setAttribute('data-theme', data.theme === 'dark' ? 'dark' : 'light');
  host.setAttribute('data-motion', data.motion === 'off' ? 'off' : 'on');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = data.styles.replaceAll(':root[data-theme=dark]', ':host([data-theme=dark])').replaceAll(':root[data-motion=off]', ':host([data-motion=off])').replaceAll('[data-theme=dark] .', ':host([data-theme=dark]) .').replaceAll(':root', ':host').replace('body {', '.modal-app {') + '\n' + data.modalStyles;
  shadow.append(style);
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('aria-label', 'JSON 大窗口');
  dialog.innerHTML = '<div class="modal-app"><header class="modal-header"><div><h2>JSON 的大一点天地 ✧</h2><p>本地处理 · 选择文本不会自动复制</p></div><button type="button" id="modal-close" class="icon-button" aria-label="关闭 JSON 大窗口">×</button></header><div class="modal-body"><div class="modal-toolbar"><span class="muted">缩进</span><div class="segmented" role="group" aria-label="缩进"><button type="button" data-indent="2" aria-pressed="true">2 空格</button><button type="button" data-indent="4" aria-pressed="false">4 空格</button><button type="button" data-indent="tab" aria-pressed="false">Tab</button></div><label class="check"><input type="checkbox" id="modal-sort"><span>递归排序</span></label><button type="button" id="modal-expand" class="text-button">展开树形</button><button type="button" id="modal-collapse" class="text-button">收起树形</button></div><div class="modal-workspace"><article class="paper source-paper"><span class="paper-tab">原始小纸条</span><div class="paper-heading"><label for="modal-input">输入 JSON / Python 字典</label><button type="button" id="modal-clear" class="text-button">清空</button></div><textarea id="modal-input" class="code-input" spellcheck="false" placeholder="粘贴 JSON 开始整理…"></textarea></article><article class="paper result-paper"><div class="paper-heading"><div class="segmented" role="group" aria-label="结果视图"><button type="button" id="modal-code" aria-pressed="true">代码</button><button type="button" id="modal-tree" aria-pressed="false">树形</button></div><button type="button" class="copy-button" id="modal-copy">⧉ 复制</button></div><div class="code-output" id="modal-output" tabindex="0"></div></article></div><p class="error" id="modal-error" role="status"></p><div class="modal-footer"><div class="actions"><button type="button" class="primary-button" id="modal-format">✧ 格式化</button><button type="button" class="soft-button" id="modal-compress">压缩</button><button type="button" class="soft-button" id="modal-export">↧ 导出</button></div><span>Ctrl / ⌘ + Enter 格式化 · Esc 关闭</span></div><p class="modal-status" id="modal-status" role="status"></p></div></div>';
  shadow.append(dialog);
  document.documentElement.append(host);
  const $ = id => shadow.getElementById(id);
  const close = () => {
    dialog.close(); host.remove();
    delete globalThis.__candyModalClose;
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
  };
  globalThis.__candyModalClose = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  $('modal-close').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  let formatted = '', parsed, tree = false, indent = 2;
  const reset = () => {
    formatted = ''; parsed = undefined;
    $('modal-output').textContent = '整理好的 JSON 会出现在这里';
    $('modal-copy').disabled = true; $('modal-export').disabled = true;
    $('modal-error').textContent = ''; $('modal-status').textContent = '';
    $('modal-input').removeAttribute('aria-invalid');
  };
  const render = () => {
    $('modal-output').innerHTML = tree ? formatter.renderCollapsible(parsed) : formatter.syntaxHighlight(formatted);
    $('modal-code').setAttribute('aria-pressed', String(!tree));
    $('modal-tree').setAttribute('aria-pressed', String(tree));
  };
  const run = compress => {
    reset();
    if (!$('modal-input').value.trim()) { $('modal-error').textContent = '请先输入 JSON。'; return; }
    const result = formatter.format($('modal-input').value, compress ? 0 : indent, $('modal-sort').checked);
    if (!result.success) { $('modal-error').textContent = result.error; $('modal-input').setAttribute('aria-invalid', 'true'); return; }
    formatted = result.result; parsed = result.parsed; render();
    $('modal-copy').disabled = false; $('modal-export').disabled = false;
    $('modal-status').textContent = '✓ 校验通过 · ' + formatted.split('\n').length + ' 行';
  };
  $('modal-input').value = data.input || '';
  $('modal-input').addEventListener('input', reset);
  $('modal-input').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(false); } });
  $('modal-format').addEventListener('click', () => run(false));
  $('modal-compress').addEventListener('click', () => run(true));
  $('modal-clear').addEventListener('click', () => { $('modal-input').value = ''; reset(); $('modal-input').focus(); });
  shadow.querySelectorAll('[data-indent]').forEach(button => button.addEventListener('click', () => {
    indent = button.dataset.indent === 'tab' ? '\t' : Number(button.dataset.indent);
    shadow.querySelectorAll('[data-indent]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    if (formatted) run(false);
  }));
  $('modal-sort').addEventListener('change', () => { if (formatted) run(false); });
  $('modal-code').addEventListener('click', () => { tree = false; if (formatted) render(); });
  $('modal-tree').addEventListener('click', () => { tree = true; if (formatted) render(); });
  [['modal-expand', true], ['modal-collapse', false]].forEach(([id, open]) => $(id).addEventListener('click', () => {
    if (!formatted) return;
    tree = true; render(); shadow.querySelectorAll('#modal-output details').forEach(detail => { detail.open = open; });
  }));
  $('modal-copy').addEventListener('click', async () => {
    if (!formatted) return;
    try {
      try { await navigator.clipboard.writeText(formatted); }
      catch {
        const area = document.createElement('textarea'); area.value = formatted; area.className = 'sr-only';
        dialog.append(area); area.select(); const success = document.execCommand('copy'); area.remove();
        if (!success) throw new Error();
      }
      $('modal-status').textContent = '已复制到剪贴板';
    } catch { $('modal-error').textContent = '复制失败，请选择结果手动复制。'; }
  });
  $('modal-export').addEventListener('click', () => {
    if (!formatted) return;
    const url = URL.createObjectURL(new Blob([formatted], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'formatted.json'; dialog.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });
  if (data.input?.trim()) run(false); else reset();
  dialog.showModal();
  $('modal-input').focus();
})();
