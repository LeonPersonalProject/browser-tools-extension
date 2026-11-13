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
  host.setAttribute('data-theme', ['dark', 'cyber', 'pixel'].includes(data.theme) ? data.theme : 'light');
  host.setAttribute('data-motion', data.motion === 'off' ? 'off' : 'on');
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = data.styles.replaceAll(':root[data-theme=dark]', ':host([data-theme=dark])').replaceAll(':root[data-theme=cyber]', ':host([data-theme=cyber])').replaceAll(':root[data-theme=pixel]', ':host([data-theme=pixel])').replaceAll(':root[data-motion=off]', ':host([data-motion=off])').replaceAll('[data-theme=dark] .', ':host([data-theme=dark]) .').replaceAll(':root', ':host').replace('body {', '.modal-app {') + '\n' + data.modalStyles;
  shadow.append(style);
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('aria-label', 'JSON 大窗口');
  dialog.innerHTML = '<div class="modal-app"><header class="modal-header"><div><h2>JSON 的大一点天地 ✧</h2><p>本地处理 · 选择文本不会自动复制</p></div><button type="button" id="modal-close" class="icon-button" aria-label="关闭 JSON 大窗口">×</button></header><div class="modal-body"><div class="modal-toolbar"><span class="muted">缩进</span><div class="segmented" role="group" aria-label="缩进"><button type="button" data-indent="2" aria-pressed="true">2 空格</button><button type="button" data-indent="4" aria-pressed="false">4 空格</button><button type="button" data-indent="tab" aria-pressed="false">Tab</button></div><label class="check"><input type="checkbox" id="modal-sort"><span>递归排序</span></label><button type="button" id="modal-expand" class="text-button">展开树形</button><button type="button" id="modal-collapse" class="text-button">收起树形</button></div><div class="modal-workspace"><article class="paper source-paper"><span class="paper-tab" id="modal-tab">原始小纸条</span><div class="paper-heading"><label for="modal-input">输入 JSON / Python 字典</label><button type="button" id="modal-clear" class="text-button">清空</button></div><textarea id="modal-input" class="code-input" spellcheck="false" placeholder="粘贴 JSON 开始整理…"></textarea></article><article class="paper result-paper"><div class="paper-heading"><div class="segmented" role="group" aria-label="结果视图"><button type="button" id="modal-code" aria-pressed="true">代码</button><button type="button" id="modal-tree" aria-pressed="false">树形</button></div><button type="button" class="copy-button" id="modal-copy">⧉ 复制</button></div><div class="code-output" id="modal-output" tabindex="0"></div></article></div><p class="error" id="modal-error" role="status"></p><div class="modal-footer"><div class="actions"><button type="button" class="primary-button" id="modal-format"><span class="deco">✧ </span>格式化</button><button type="button" class="soft-button" id="modal-compress">压缩</button><button type="button" class="soft-button" id="modal-export">↧ 导出</button></div><span>Ctrl / ⌘ + Enter 格式化 · Esc 关闭</span></div><p class="modal-status" id="modal-status" role="status"></p></div></div>';
  shadow.append(dialog);
  document.documentElement.append(host);
  const $ = id => shadow.getElementById(id);
  const sourceActions = document.createElement('div');
  sourceActions.className = 'actions modal-source-actions';
  sourceActions.append($('modal-format'), $('modal-compress'));
  $('modal-input').parentElement.append(sourceActions);
  const importButton = document.createElement('button');
  importButton.type = 'button'; importButton.className = 'soft-button';
  importButton.id = 'modal-import'; importButton.textContent = '导入文件';
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.hidden = true; fileInput.id = 'modal-file';
  fileInput.accept = '.json,.txt,application/json,text/plain';
  sourceActions.prepend(importButton, fileInput);
  const resultHeading = $('modal-output').parentElement.querySelector('.paper-heading');
  resultHeading.append($('modal-export'));
  const treeActions = document.createElement('div'); treeActions.className = 'actions';
  treeActions.append($('modal-expand'), $('modal-collapse'));
  $('modal-expand').textContent = '全部展开'; $('modal-collapse').textContent = '全部收起';
  $('modal-output').before(treeActions);
  const searchRow = document.createElement('div'); searchRow.className = 'search-row';
  const searchInput = document.createElement('input');
  searchInput.type = 'search'; searchInput.id = 'modal-search';
  searchInput.placeholder = '查找键 / 路径，如 user.name、/user/name';
  searchInput.setAttribute('aria-label', '查找 JSON 键或路径');
  const searchButton = document.createElement('button');
  searchButton.type = 'button'; searchButton.className = 'soft-button';
  searchButton.id = 'modal-search-btn'; searchButton.textContent = '查找';
  searchRow.append(searchInput, searchButton);
  const searchResult = document.createElement('pre');
  searchResult.id = 'modal-search-result'; searchResult.className = 'search-result';
  searchResult.hidden = true; searchResult.setAttribute('aria-live', 'polite');
  $('modal-error').after(searchRow, searchResult);
  $('modal-status').setAttribute('role', 'status');
  $('modal-status').setAttribute('aria-live', 'polite');
  let worker;
  let workerUrl;
  let revision = 0;
  const stopWorker = () => {
    worker?.terminate(); worker = undefined;
    if (workerUrl) URL.revokeObjectURL(workerUrl);
    workerUrl = undefined;
  };
  const close = () => {
    revision++; stopWorker();
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
  let formatted = '', parsed, tree = !!data.tree, indent = data.indent === 'tab' ? '\t' : Number(data.indent || 2);
  $('modal-sort').checked = !!data.sort;
  shadow.querySelectorAll('[data-indent]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.indent === String(data.indent || 2))));
  dialog.setAttribute('aria-label', '网页内 JSON 窗口');
  shadow.querySelector('h2').textContent = '网页内 JSON 窗口';
  shadow.querySelector('.modal-header p').textContent = '所在网页可能访问内容；敏感数据请使用扩展独立页。输入上限 5 MiB。';
  const modalTab = $('modal-tab');
  if (modalTab) modalTab.textContent = data.theme === 'cyber' ? 'SOURCE // 输入' : data.theme === 'pixel' ? 'INPUT' : '原始小纸条';
  const reset = () => {
    revision++; stopWorker();
    searchResult.hidden = true; searchResult.textContent = '';
    formatted = ''; parsed = undefined;
    $('modal-output').textContent = '整理好的 JSON 会出现在这里';
    $('modal-copy').disabled = true; $('modal-export').disabled = true;
    $('modal-error').textContent = ''; $('modal-status').textContent = $('modal-input').value.trim() ? '输入已更新，等待处理' : '等待输入';
    $('modal-code').setAttribute('aria-pressed', String(!tree));
    $('modal-tree').setAttribute('aria-pressed', String(tree));
    $('modal-input').removeAttribute('aria-invalid');
  };
  const render = () => {
    if (tree) formatter.mountTree($('modal-output'), parsed, async path => {
      try { await navigator.clipboard.writeText(path); $('modal-status').textContent = '已复制路径'; }
      catch { $('modal-error').textContent = '路径复制失败。'; $('modal-status').textContent = '路径复制失败'; }
    });
    else if (formatted.length > 200000) $('modal-output').textContent = formatted;
    else $('modal-output').innerHTML = formatter.syntaxHighlight(formatted);
    $('modal-code').setAttribute('aria-pressed', String(!tree));
    $('modal-tree').setAttribute('aria-pressed', String(tree));
  };
  const run = async compress => {
    reset();
    if (!$('modal-input').value.trim()) { $('modal-error').textContent = '请先输入 JSON。'; $('modal-status').textContent = '未处理：输入为空'; return false; }
    if (new Blob([$('modal-input').value]).size > 5 * 1024 * 1024) { $('modal-error').textContent = '输入上限为 5 MiB。'; $('modal-status').textContent = '未处理：超过规模上限'; return false; }
    const token = revision;
    $('modal-status').textContent = '正在解析与整理…';
    const result = await new Promise(resolve => {
      const url = URL.createObjectURL(new Blob([data.workerSource + '\nself.onmessage=({data})=>self.postMessage(globalThis.__candyJsonFormatter.format(data.text,data.indent,data.sort));'], { type: 'text/javascript' }));
      try {
        workerUrl = url;
        worker = new Worker(url);
        worker.onmessage = event => { stopWorker(); resolve(event.data); };
        worker.onerror = () => { stopWorker(); resolve({ success: false, error: '后台处理失败或被网页策略禁止；请使用独立页。' }); };
        worker.postMessage({ text: $('modal-input').value, indent: compress ? 0 : indent, sort: $('modal-sort').checked });
      } catch { stopWorker(); URL.revokeObjectURL(url); resolve({ success: false, error: '无法启动后台处理；请使用独立页。' }); }
    });
    if (revision !== token) return false;
    if (!result.success) { $('modal-error').textContent = result.error; $('modal-status').textContent = '处理失败'; $('modal-input').setAttribute('aria-invalid', 'true'); return false; }
    formatted = result.result; parsed = result.parsed; render();
    $('modal-copy').disabled = false; $('modal-export').disabled = false;
    $('modal-status').textContent = (compress ? '已压缩' : '已格式化') + ' · 校验通过 · ' + formatted.split('\n').length + ' 行';
    return true;
  };
  let importRevision = 0;
  const readFile = async file => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { $('modal-error').textContent = '导入失败：请选择 5 MiB 以内的文件。'; return; }
    reset();
    const token = ++importRevision;
    const inputRevision = revision;
    $('modal-status').textContent = '正在读取文件…';
    try {
      const text = await file.text();
      if (token !== importRevision || inputRevision !== revision || !host.isConnected) return;
      if (new Blob([text]).size > 5 * 1024 * 1024) throw new Error('解码后的文本超过 5 MiB。');
      $('modal-input').value = text;
      reset();
      $('modal-status').textContent = '文件已导入，等待格式化';
      $('modal-input').focus();
    } catch (error) {
      if (token !== importRevision || inputRevision !== revision) return;
      $('modal-error').textContent = '导入失败：' + error.message;
      $('modal-status').textContent = '文件读取失败';
    }
  };
  importButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => { await readFile(fileInput.files[0]); fileInput.value = ''; });
  const drop = $('modal-input').parentElement;
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragover'); readFile(event.dataTransfer.files[0]); });
  const search = async () => {
    const query = searchInput.value.trim();
    if (!query) { searchResult.hidden = false; searchResult.textContent = '输入键名、点路径或 JSON Pointer 开始查找。'; return; }
    if (!formatted && !await run(false)) return;
    searchResult.hidden = false;
    searchResult.textContent = formatter.searchText(parsed, query);
    $('modal-status').textContent = '查找完成；结果与扫描规模均受限制';
  };
  searchButton.addEventListener('click', search);
  searchInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search(); } });
  searchInput.addEventListener('input', () => { searchResult.hidden = true; });
  $('modal-input').value = data.input || '';
  $('modal-input').addEventListener('paste', event => {
    const input = $('modal-input');
    const next = input.value.slice(0, input.selectionStart) + event.clipboardData.getData('text') + input.value.slice(input.selectionEnd);
    if (new Blob([next]).size > 5 * 1024 * 1024) { event.preventDefault(); $('modal-error').textContent = '粘贴后超过 5 MiB 上限。'; }
  });
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
  $('modal-code').addEventListener('click', () => { tree = false; $('modal-code').setAttribute('aria-pressed', 'true'); $('modal-tree').setAttribute('aria-pressed', 'false'); if (formatted) render(); });
  $('modal-tree').addEventListener('click', () => { tree = true; $('modal-code').setAttribute('aria-pressed', 'false'); $('modal-tree').setAttribute('aria-pressed', 'true'); if (formatted) render(); });
  [['modal-expand', true], ['modal-collapse', false]].forEach(([id, open]) => $(id).addEventListener('click', () => {
    if (!formatted) { $('modal-status').textContent = '请先格式化 JSON'; return; }
    tree = true; render();
    const complete = formatter.toggleTree($('modal-output'), open);
    $('modal-status').textContent = complete ? (open ? '已全部展开' : '已全部收起') : '部分展开完成（最多 2000 个容器，每层首批 100 项）；其余请逐层加载';
  }));
  $('modal-copy').addEventListener('click', async () => {
    if (!formatted) return;
    $('modal-error').textContent = '';
    try {
      try { await navigator.clipboard.writeText(formatted); }
      catch {
        const area = document.createElement('textarea'); area.value = formatted; area.className = 'sr-only';
        dialog.append(area); area.select(); const success = document.execCommand('copy'); area.remove();
        if (!success) throw new Error();
      }
      $('modal-status').textContent = '已复制到剪贴板';
    } catch { $('modal-error').textContent = '复制失败，请选择结果手动复制。'; $('modal-status').textContent = '复制失败'; }
  });
  $('modal-export').addEventListener('click', () => {
    if (!formatted) return;
    const url = URL.createObjectURL(new Blob([formatted], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'formatted.json'; dialog.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    $('modal-status').textContent = '已发起下载 formatted.json';
  });
  // Do not auto-process transferred large inputs.
  reset();

  dialog.showModal();
  $('modal-input').focus();
})();
