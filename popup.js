import { appView, tools } from './utils/appView.js';
import { initSelects } from './utils/controls.js';
import { jsonFormatter } from './utils/jsonFormatter.js';
import { timestamp } from './utils/timestamp.js';
import { encoder } from './utils/encoder.js';
import { colorPicker } from './utils/colorPicker.js';
import { converter } from './utils/converter.js';
import { passwordGenerator } from './utils/passwordGenerator.js';

const $ = id => document.getElementById(id);
const pref = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* 隐私模式仍可使用本次设置。 */ } }
};
document.getElementById('app').innerHTML = appView();
const root = document.documentElement;
let currentTool = 'json';
let toastTimer;
let moodTimer;
let closeSelects;
function feedback(message, failure = false, announce = true) {
  if (failure && !announce) {
    clearTimeout(toastTimer);
    $('toast').classList.remove('show');
  }
  if (announce) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2400);
  }
  const nav = document.querySelector('[data-tool="' + currentTool + '"]');
  document.querySelectorAll('.tool-nav-item').forEach(item => item.classList.remove('is-happy', 'is-confused'));
  nav.classList.add(failure ? 'is-confused' : 'is-happy');
  clearTimeout(moodTimer);
  moodTimer = setTimeout(() => nav.classList.remove('is-happy', 'is-confused'), 1100);
  if (!failure && announce && root.dataset.motion !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rect = nav.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const star = document.createElement('span');
      star.className = 'sparkle';
      star.textContent = ['✦', '✧', '⋆', '✷'][i];
      star.style.left = rect.left + 12 + i * 10 + 'px';
      star.style.top = rect.top + 5 + (i % 2) * 8 + 'px';
      star.style.animationDelay = i * 45 + 'ms';
      document.querySelector('.sparkles').append(star);
      setTimeout(() => star.remove(), 1000);
    }
  }
}
async function copyText(text) {
  if (text === undefined || text === null || text === '—') { feedback('还没有可复制的结果', true); return; }
  try {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const focused = document.activeElement;
      const area = document.createElement('textarea');
      area.value = text;
      area.className = 'sr-only';
      document.body.append(area);
      area.select();
      const success = document.execCommand('copy');
      area.remove();
      focused?.focus();
      if (!success) throw new Error();
    }
    feedback('已复制到剪贴板');
  } catch { feedback('复制失败，请选择结果后手动复制', true); }
}
function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function initShell() {
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = mode => {
    root.dataset.theme = mode === 'system' ? (systemTheme.matches ? 'dark' : 'light') : mode;
    $('theme-mode').value = mode;
    $('theme-mode').dispatchEvent(new Event('change'));
  };
  let theme = pref.get('theme', 'light');
  if (!['light', 'dark', 'system'].includes(theme)) theme = 'light';
  // 设置同步与应用分开，避免 change 监听递归。
  root.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  $('theme-mode').value = theme;
  $('theme-mode').addEventListener('change', () => {
    theme = $('theme-mode').value;
    pref.set('theme', theme);
    root.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  });
  systemTheme.addEventListener('change', () => {
    if (theme === 'system') root.dataset.theme = systemTheme.matches ? 'dark' : 'light';
  });
  $('theme-quick').addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  let motion = pref.get('candy-motion', 'on') !== 'off';
  const applyMotion = () => {
    root.dataset.motion = motion ? 'on' : 'off';
    $('motion-btn').setAttribute('aria-pressed', String(motion));
    $('motion-toggle').checked = motion;
    pref.set('candy-motion', motion ? 'on' : 'off');
  };
  applyMotion();
  $('motion-btn').addEventListener('click', () => { motion = !motion; applyMotion(); });
  $('motion-toggle').addEventListener('change', () => { motion = $('motion-toggle').checked; applyMotion(); });
  const isDrawer = () => document.body.classList.contains('fullpage-view') && innerWidth <= 650;
  let collapsed = pref.get('candy-sidebar', isDrawer() ? 'collapsed' : 'expanded') === 'collapsed';
  const applySidebar = () => {
    closeSelects?.();
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    $('nav-overlay').hidden = collapsed || !isDrawer();
    if (isDrawer()) {
      document.querySelector('.main-shell').inert = !collapsed;
      if (!collapsed) $('nav-toggle').focus();
    }
    $('nav-toggle').setAttribute('aria-expanded', String(!collapsed));
    $('nav-toggle').setAttribute('aria-label', collapsed ? '展开侧边栏' : '收起侧边栏');
    $('nav-toggle').title = collapsed ? '展开侧边栏' : '收起侧边栏';
  };
  applySidebar();
  $('nav-toggle').addEventListener('click', () => {
    collapsed = !collapsed;
    pref.set('candy-sidebar', collapsed ? 'collapsed' : 'expanded');
    applySidebar();
  });
  $('nav-overlay').addEventListener('click', () => { collapsed = true; applySidebar(); $('nav-toggle').focus(); });
  window.addEventListener('resize', () => { document.querySelector('.main-shell').inert = false; applySidebar(); });
  document.addEventListener('keydown', event => {
    if (!isDrawer() || collapsed) return;
    if (event.key === 'Escape') { collapsed = true; applySidebar(); $('nav-toggle').focus(); }
    if (event.key === 'Tab') {
      const buttons = [...document.querySelector('.sidebar').querySelectorAll('a, button')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.querySelectorAll('[data-tool]').forEach(item => item.addEventListener('click', () => { if (isDrawer()) { collapsed = true; applySidebar(); $('nav-toggle').focus(); } }));
  const dialog = $('settings-panel');
  $('settings-btn').addEventListener('click', () => { closeSelects(); dialog.showModal(); });
  $('close-settings').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { closeSelects(); $('settings-btn').focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  $('fullscreen-btn').title = $('fullscreen-btn').ariaLabel = '独立页继续编辑（一次性传递，不保存草稿）';
  $('fullscreen-btn').addEventListener('click', async () => {
    const state = {
      tool: currentTool,
      fields: [...document.querySelectorAll('.page input:not([type=file]), .page textarea, .page select')].map(el => ({ id: el.id, value: el.value, checked: el.checked })),
      outputs: [...document.querySelectorAll('.page output')].map(el => ({ id: el.id, text: el.textContent })),
      jsonResult: $('json-output').dataset.formatted || '',
      tree: $('json-tree-view').getAttribute('aria-pressed') === 'true'
    };
    const url = new URL('fullpage.html', location.href);
    if (globalThis.chrome?.tabs?.create) {
      const response = await chrome.runtime.sendMessage({ type: 'candy-open', state });
      feedback(response?.success ? '已打开独立页并传递临时状态' : '独立页打开失败', !response?.success);
    } else {
      const child = window.open(url.href, '_blank');
      const receive = event => {
        if (event.source !== child || event.origin !== location.origin || event.data !== 'candy-ready') return;
        child.postMessage({ type: 'candy-transfer', state }, location.origin);
        window.removeEventListener('message', receive);
      };
      window.addEventListener('message', receive);
      setTimeout(() => window.removeEventListener('message', receive), 30000);
    }
  });
  $('editor-size').addEventListener('input', () => root.style.setProperty('--editor-size', Math.max(12, Math.min(24, Number($('editor-size').value) || 14)) + 'px'));
  $('workspace-mode').addEventListener('change', () => root.dataset.workspace = $('workspace-mode').value);
  $('column-ratio').addEventListener('input', () => root.style.setProperty('--input-ratio', $('column-ratio').value + '%'));
  document.querySelectorAll('[data-tool]').forEach(item => item.addEventListener('click', () => showTool(item.dataset.tool)));
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); showTool('json'); });
  window.addEventListener('hashchange', () => { if (tools[location.hash.slice(1)]) showTool(location.hash.slice(1)); });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (button) copyText($(button.dataset.copy).textContent);
  });
}
function showTool(id) {
  if (!Object.hasOwn(tools, id)) id = 'json';
  closeSelects?.();
  currentTool = id;
  clearTimeout(toastTimer);
  $('toast').classList.remove('show');
  document.querySelector('.sparkles').replaceChildren();
  document.querySelectorAll('.page').forEach(page => { page.hidden = page.id !== id + '-page'; });
  document.querySelectorAll('[data-tool]').forEach(item => {
    if (item.dataset.tool === id) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
  });
  $('page-title').textContent = tools[id][0];
  $('page-description').textContent = tools[id][2];
  $('mood-text').textContent = tools[id][3];
  $(''+id+'-page').classList.remove('page-enter');
  void $(''+id+'-page').offsetWidth;
  $(''+id+'-page').classList.add('page-enter');
  document.querySelector('.tools-content').scrollTop = 0;
  pref.set('candy-tool', id);
  history.replaceState(null, '', '#' + id);
}

function initJson() {
  let formatted = '';
  let parsed;
  let tree = false;
  const input = $('json-input');
  const clearResult = () => {
    formatted = ''; parsed = undefined;
    delete $('json-output').dataset.formatted;
    $('json-output').textContent = '整理好的 JSON 会出现在这里';
    $('json-output').classList.add('empty');
    $('json-status').textContent = '等待输入';
    $('json-lines').textContent = '0 行';
    $('json-search-result').hidden = true;
    $('json-copy').disabled = true;
    $('json-export').disabled = true;
  };
  const render = () => {
    $('json-output').classList.remove('empty');
    if (tree) jsonFormatter.mountTree($('json-output'), parsed, copyText);
    else if (formatted.length > 200000) $('json-output').textContent = formatted;
    else $('json-output').innerHTML = jsonFormatter.syntaxHighlight(formatted);
    $('json-code-view').setAttribute('aria-pressed', String(!tree));
    $('json-tree-view').setAttribute('aria-pressed', String(tree));
    $('json-lines').textContent = formatted.split('\n').length + ' 行';
    $('json-status').textContent = '✓ 校验通过';
    $('json-copy').disabled = false;
    $('json-export').disabled = false;
  };
  let worker;
  let revision = 0;
  const run = async (compress = false, announce = true) => {
    revision++; worker?.terminate();
    clearResult();
    $('json-error').textContent = '';
    if (!input.value.trim()) {
      $('json-error').textContent = '先粘贴一些 JSON，或点“试个例子”。';
      input.setAttribute('aria-invalid', 'true');
      $('json-status').textContent = '未处理：输入为空';
      return false;
    }
    const indent = $('json-indent').value === 'tab' ? '\t' : Number($('json-indent').value);
    if (new Blob([input.value]).size > 5 * 1024 * 1024) { $('json-error').textContent = '输入上限为 5 MiB。'; $('json-status').textContent = '未处理：超过规模上限'; return false; }
    worker?.terminate();
    const token = ++revision;
    $('json-status').textContent = '正在解析与整理…';
    const result = await new Promise(resolve => {
      try {
        const task = new Worker(new URL('./utils/jsonWorker.js', import.meta.url), { type: 'module' });
        worker = task;
        task.onmessage = event => { task.terminate(); resolve(event.data); };
        task.onerror = () => { task.terminate(); resolve({ success: false, error: '后台处理失败，请重新打开独立页后重试。' }); };
        task.postMessage({ text: input.value, indent: compress ? 0 : indent, sort: $('json-sort').checked });
      } catch { resolve({ success: false, error: '无法启动后台处理，请重新打开独立页后重试。' }); }
    });
    if (token !== revision) return false;
    input.setAttribute('aria-invalid', String(!result.success));
    if (!result.success) {
      $('json-error').textContent = result.error;
      $('json-status').textContent = '校验失败';
      feedback('请检查 JSON 格式', true, false);
      return false;
    }
    formatted = result.result; parsed = result.parsed;
    $('json-output').dataset.formatted = formatted;
    render();
    $('json-status').textContent = compress ? '已压缩 · 校验通过' : '已格式化 · 校验通过';
    if (announce) feedback(compress ? '已压缩 JSON' : '已格式化 JSON');
    return true;
  };
  const changed = () => {
    revision++;
    worker?.terminate();
    $('json-input-count').textContent = input.value.length.toLocaleString() + ' 字符';
    $('json-error').textContent = '';
    input.removeAttribute('aria-invalid');
    clearResult();
  };
  input.addEventListener('paste', event => {
    const next = input.value.slice(0, input.selectionStart) + event.clipboardData.getData('text') + input.value.slice(input.selectionEnd);
    if (new Blob([next]).size > 5 * 1024 * 1024) { event.preventDefault(); feedback('粘贴后超过 5 MiB 上限', true); }
  });
  input.addEventListener('input', changed);
  input.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
  });
  $('json-format').addEventListener('click', () => run());
  $('json-compress').addEventListener('click', () => run(true));
  $('json-indent').addEventListener('change', () => { if (formatted) run(false, false); });
  $('json-sort').addEventListener('change', () => { if (formatted) run(false, false); });
  $('json-clear').addEventListener('click', () => { input.value = ''; changed(); input.focus(); });
  $('json-example').addEventListener('click', () => {
    input.value = JSON.stringify({ greeting: '你好，软糖实验室 🍬', user: { name: '小软糖', active: true }, colors: ['strawberry', 'mint', 'lemon'], note: 'True / None 保持原样' });
    changed(); run();
  });
  $('json-copy').addEventListener('click', () => copyText(formatted));
  [['json-expand', true], ['json-collapse', false]].forEach(([id, open]) => $(id).addEventListener('click', () => {
    if (!formatted) { feedback('请先格式化 JSON', true); return; }
    tree = true; render();
    const complete = jsonFormatter.toggleTree($('json-output'), open);
    feedback(complete ? (open ? '已全部展开' : '已全部收起') : '部分展开完成（最多 2000 个容器，每层首批 100 项）；其余请逐层加载');
  }));
  $('json-code-view').addEventListener('click', () => { tree = false; if (formatted) render(); else $('json-code-view').setAttribute('aria-pressed', 'true'); $('json-tree-view').setAttribute('aria-pressed', 'false'); });
  $('json-tree-view').addEventListener('click', () => { tree = true; $('json-tree-view').setAttribute('aria-pressed', 'true'); $('json-code-view').setAttribute('aria-pressed', 'false'); if (formatted) render(); });
  const search = async () => {
    const query = $('json-search').value.trim();
    if (!query) { $('json-search-result').hidden = false; $('json-search-result').textContent = jsonFormatter.searchText(null, ''); return; }
    if (!formatted && !await run(false, false)) return;
    $('json-search-result').hidden = false;
    $('json-search-result').textContent = jsonFormatter.searchText(parsed, query);
  };
  $('json-search-btn').addEventListener('click', search);
  $('json-search').addEventListener('keydown', event => { if (event.key === 'Enter') search(); });
  $('json-export').addEventListener('click', async () => { if (formatted || await run(false, false)) { download(formatted, 'formatted.json'); feedback('已发起下载 formatted.json'); } });
  let importRevision = 0;
  const readFile = async file => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { $('json-error').textContent = '导入失败：请选择 5 MiB 以内的文件。'; return; }
    changed();
    const token = ++importRevision;
    const inputRevision = revision;
    $('json-status').textContent = '正在读取文件…';
    try {
      const text = await file.text();
      if (token !== importRevision || inputRevision !== revision) return;
      if (new Blob([text]).size > 5 * 1024 * 1024) throw new Error('解码后的文本超过 5 MiB。');
      input.value = text; changed();
      $('json-status').textContent = '文件已导入，等待格式化';
      feedback('文件已导入，点击格式化处理');
    } catch (error) {
      if (token !== importRevision || inputRevision !== revision) return;
      $('json-error').textContent = '导入失败：' + error.message;
      $('json-status').textContent = '文件读取失败';
    }
  };
  $('json-import').addEventListener('click', () => $('json-file').click());
  $('json-file').addEventListener('change', async () => { await readFile($('json-file').files[0]); $('json-file').value = ''; });
  const drop = $('json-drop');
  drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragover'); readFile(event.dataTransfer.files[0]); });
  $('json-modal').addEventListener('click', async () => {
    if (!globalThis.chrome?.scripting) { feedback('请在浏览器扩展中打开页面大窗口', true); return; }
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) throw new Error('此页面不支持注入，请切换到普通网页。');
      const styles = await fetch(chrome.runtime.getURL('popup.css')).then(response => response.text());
      const modalStyles = await fetch(chrome.runtime.getURL('json-modal-inject.css')).then(response => response.text());
      const workerSource = await fetch(chrome.runtime.getURL('utils/jsonCore.js')).then(response => response.text());
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['utils/jsonCore.js'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: data => { globalThis.__candyModalData = data; }, args: [{ input: input.value, indent: $('json-indent').value, sort: $('json-sort').checked, tree, theme: root.dataset.theme, motion: root.dataset.motion, styles, modalStyles, workerSource }] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['json-modal-inject.js'] });
      feedback('已在当前网页打开 JSON 窗口');
    } catch (error) { feedback(error.message || '大窗口打开失败', true); }
  });
  input.addEventListener('candy-restore-result', event => {
    const result = jsonFormatter.format(event.detail);
    if (!result.success) return;
    formatted = event.detail; parsed = result.parsed;
    $('json-output').dataset.formatted = formatted;
    render();
  });
  $('json-copy').parentElement.append($('json-export'));
  clearResult();
}

function initTimestamp() {
  let last = null;
  let source = 'timestamp';
  const zone = () => $('timestamp-custom-zone').value.trim() || $('timestamp-zone').value;
  $('timestamp-custom-zone').addEventListener('input', () => { convert(); $('time-diff-result').textContent = ''; });
  const clear = () => {
    last = null;
    ['local-time', 'utc-time', 'timestamp-iso', 'timestamp-sec', 'timestamp-ms'].forEach(id => { $(id).textContent = '—'; });
    $('timestamp-detected').textContent = '等待有效时间';
    $('time-add-result').textContent = '';
  };
  const display = result => {
    $('timestamp-error').textContent = result.success ? '' : result.error;
    if (!result.success) { clear(); return; }
    last = result;
    const map = { 'local-time': 'localTime', 'utc-time': 'utcTime', 'timestamp-iso': 'iso', 'timestamp-sec': 'timestampSec', 'timestamp-ms': 'timestampMs' };
    Object.entries(map).forEach(([id, key]) => { $(id).textContent = result[key]; });
    $('timestamp-detected').textContent = result.unit ? '按' + (result.unit === 'ms' ? '毫秒' : '秒') + '转换 · 所选时区' : '日期转换 · 所选时区';
  };
  const convert = () => {
    const input = source === 'timestamp' ? $('timestamp-input') : $('datetime-input');
    $('time-add-result').textContent = '';
    if (!input.value.trim()) { clear(); $('timestamp-error').textContent = ''; return; }
    const result = source === 'timestamp' ? timestamp.timestampToDate(input.value, $('timestamp-unit').value, zone()) : timestamp.dateToTimestamp(input.value, zone());
    input.setAttribute('aria-invalid', String(!result.success));
    display(result);
  };
  $('timestamp-input').addEventListener('input', () => { source = 'timestamp'; convert(); });
  $('datetime-input').addEventListener('input', () => { source = 'date'; convert(); });
  $('datetime-input').addEventListener('keydown', event => { if (event.key === 'Enter') { source = 'date'; convert(); } });
  $('datetime-convert').addEventListener('click', () => { source = 'date'; convert(); });
  $('timestamp-unit').addEventListener('change', () => { source = 'timestamp'; convert(); });
  $('timestamp-zone').addEventListener('change', () => { convert(); $('time-diff-result').textContent = ''; });
  $('timestamp-now').addEventListener('click', () => {
    $('timestamp-input').value = $('timestamp-unit').value === 's' ? timestamp.getCurrentTimestamp().timestampSec : Date.now();
    source = 'timestamp'; convert(); feedback(last ? '已转换当前时间' : '当前时间转换失败，请检查时区', !last);
  });
  $('time-diff').addEventListener('click', () => {
    const start = timestamp.dateToTimestamp($('time-start').value, zone());
    const end = timestamp.dateToTimestamp($('time-end').value, zone());
    if (!start.success || !end.success) { $('time-diff-result').textContent = (!start.success ? '开始：' + start.error : '结束：' + end.error); return; }
    const diff = end.timestampMs - start.timestampMs;
    const seconds = Math.abs(diff) / 1000;
    $('time-diff-result').textContent = '结束 − 开始：' + (diff < 0 ? '−' : '') + Math.floor(seconds / 86400) + ' 天 ' + Math.floor(seconds % 86400 / 3600) + ' 小时 ' + Math.floor(seconds % 3600 / 60) + ' 分 ' + (Math.round(seconds % 60 * 1000) / 1000) + ' 秒（' + diff.toLocaleString() + ' ms）';
  });
  ['time-start', 'time-end'].forEach(id => $(id).addEventListener('input', () => { $('time-diff-result').textContent = ''; }));
  ['time-amount', 'time-add-unit'].forEach(id => $(id).addEventListener(id === 'time-amount' ? 'input' : 'change', () => { $('time-add-result').textContent = ''; }));
  $('time-add').addEventListener('click', () => {
    if (!last) { $('time-add-result').textContent = '请先转换一个有效时间。'; return; }
    const amount = $('time-amount').value.trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(amount)) { $('time-add-result').textContent = '请输入有效的加减数值。'; return; }
    const result = timestamp.fromMilliseconds(last.timestampMs + Number(amount) * Number($('time-add-unit').value), zone());
    $('time-add-result').textContent = result.success ? result.localTime + '\n' + result.iso : result.error;
  });
}

function initEncoder() {
  const input = $('encode-input'), output = $('encode-output');
  const counts = () => {
    $('encode-input-count').textContent = [...input.value].length.toLocaleString() + ' 字符';
    $('encode-output-count').textContent = [...output.value].length.toLocaleString() + ' 字符';
    $('encode-copy').disabled = !output.value;
    $('encode-swap').disabled = !output.value;
  };
  const changed = () => { output.value = ''; $('encode-error').textContent = ''; input.removeAttribute('aria-invalid'); counts(); };
  const run = decode => {
    const result = encoder[decode ? 'decode' : 'encode']($('encode-type').value, input.value);
    output.value = result.success ? result.result : '';
    $('encode-error').textContent = result.success ? '' : result.error;
    input.setAttribute('aria-invalid', String(!result.success));
    counts();
    feedback(result.success ? '转换完成' : '转换失败，请检查输入', !result.success, result.success);
  };
  $('encode-btn').addEventListener('click', () => run(false));
  $('decode-btn').addEventListener('click', () => run(true));
  input.addEventListener('input', changed);
  input.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(false); } });
  $('encode-type').addEventListener('change', () => {
    changed();
    const jwt = $('encode-type').value === 'jwt';
    $('jwt-notice').hidden = !jwt;
    $('encode-btn').textContent = jwt ? '✧ 解析 JWT' : '✧ 编码';
    $('decode-btn').hidden = jwt;
    $('encode-swap').hidden = jwt;
  });
  $('encode-swap').addEventListener('click', () => {
    const value = input.value;
    input.value = output.value; output.value = value;
    $('encode-error').textContent = ''; input.removeAttribute('aria-invalid');
    counts();
    const workspace = document.querySelector('.encode-workspace');
    workspace.classList.remove('is-swapping'); void workspace.offsetWidth; workspace.classList.add('is-swapping');
  });
  $('encode-copy').addEventListener('click', () => copyText(output.value));
  $('encode-clear').addEventListener('click', () => { input.value = ''; changed(); input.focus(); });
  counts();
}

function initColors() {
  let color = colorPicker.parse('#f5a7c1');
  let valid = true;
  let history;
  try { history = JSON.parse(pref.get('candy-colors', '[]')).filter(value => /^#[\da-f]{6}([\da-f]{2})?$/i.test(value)).slice(0, 8); }
  catch { history = []; }
  const renderHistory = () => {
    $('color-history').replaceChildren();
    history.forEach(hex => {
      const button = document.createElement('button');
      button.type = 'button'; button.style.background = hex; button.title = hex;
      button.setAttribute('aria-label', '使用颜色 ' + hex);
      button.addEventListener('click', () => { color = colorPicker.parse(hex); valid = true; $('color-error').textContent = ''; $('hex-input').removeAttribute('aria-invalid'); update(); });
      $('color-history').append(button);
    });
    if (!history.length) { const note = document.createElement('span'); note.className = 'muted'; note.textContent = '选好的颜色会收藏在这里'; $('color-history').append(note); }
  };
  const remember = () => {
    if (!valid) return;
    const hex = colorPicker.formats(color).hex;
    history = [hex, ...history.filter(item => item !== hex)].slice(0, 8);
    pref.set('candy-colors', JSON.stringify(history)); renderHistory();
  };
  const contrast = () => {
    try {
      if (!valid) throw new Error('先输入有效的前景颜色。');
      const bg = colorPicker.parse($('contrast-background').value);
      const result = colorPicker.contrast(color, bg);
      $('contrast-preview').style.color = colorPicker.formats(result.foreground).rgb;
      $('contrast-preview').style.background = colorPicker.formats(result.background).rgb;
      $('contrast-preview').hidden = false;
      $('contrast-ratio').textContent = result.ratio.toFixed(2) + ':1';
      $('contrast-rating').textContent = result.ratio >= 7 ? 'AAA 普通文本通过' : result.ratio >= 4.5 ? 'AA 普通文本通过\nAAA 大文本通过' : result.ratio >= 3 ? '仅 AA 大文本通过' : 'AA 未通过';
      $('contrast-background').removeAttribute('aria-invalid');
    } catch (error) {
      $('contrast-ratio').textContent = '—'; $('contrast-rating').textContent = error.message;
      $('contrast-preview').hidden = true;
      $('contrast-background').setAttribute('aria-invalid', String(valid));
    }
  };
  function update(syncInput = true) {
    const formats = colorPicker.formats(color);
    $('color-fill').style.background = formats.rgb;
    $('color-card-hex').textContent = formats.hex;
    $('color-input').value = formats.hex.slice(0, 7);
    $('color-alpha').value = Math.round(color.a * 100);
    $('color-alpha-value').textContent = Math.round(color.a * 100) + '%';
    $('hex-value').textContent = formats.hex; $('rgb-value').textContent = formats.rgb; $('hsl-value').textContent = formats.hsl;
    if (syncInput) $('hex-input').value = formats.hex;
    contrast();
  }
  $('hex-input').addEventListener('input', () => {
    try {
      color = colorPicker.parse($('hex-input').value); valid = true;
      $('color-error').textContent = ''; $('hex-input').removeAttribute('aria-invalid'); update(false);
    } catch (error) {
      valid = false; $('hex-input').setAttribute('aria-invalid', 'true'); $('color-error').textContent = error.message;
      ['hex-value', 'rgb-value', 'hsl-value', 'color-card-hex'].forEach(id => { $(id).textContent = '—'; });
      $('color-fill').style.background = 'transparent'; contrast();
    }
  });
  $('hex-input').addEventListener('change', remember);
  $('color-input').addEventListener('input', () => { color = { ...colorPicker.parse($('color-input').value), a: color.a }; valid = true; $('hex-input').removeAttribute('aria-invalid'); $('color-error').textContent = ''; update(); });
  $('color-input').addEventListener('change', remember);
  $('color-alpha').addEventListener('input', () => { color.a = Number($('color-alpha').value) / 100; valid = true; $('color-error').textContent = ''; $('hex-input').removeAttribute('aria-invalid'); update(); });
  $('color-alpha').addEventListener('change', remember);
  $('contrast-background').addEventListener('input', contrast);
  $('color-eyedropper').addEventListener('click', async () => {
    if (!globalThis.EyeDropper) { feedback('当前浏览器不支持屏幕取色，请使用色块选择器', true); return; }
    try {
      const result = await new EyeDropper().open();
      color = colorPicker.parse(result.sRGBHex); valid = true;
      $('color-error').textContent = ''; $('hex-input').removeAttribute('aria-invalid'); update(); remember(); feedback('收集到一个新颜色');
    } catch (error) { if (error.name !== 'AbortError') feedback('屏幕取色失败，请使用色块选择器', true); }
  });
  if (!globalThis.EyeDropper) $('color-eyedropper').title = '浏览器不支持 EyeDropper，可使用色块选择器';
  update(); renderHistory();
}
function initConverter() {
  const ids = ['binary', 'octal', 'decimal', 'hexadecimal'];
  const run = () => {
    const text = $('converter-input').value;
    const result = converter.convertToAll(text, $('converter-from-base').value, $('converter-prefix').checked, $('converter-uppercase').checked, $('converter-group').checked);
    $('converter-error').textContent = text.trim() && !result.success ? result.error : '';
    $('converter-input').setAttribute('aria-invalid', String(Boolean(text.trim() && !result.success)));
    ids.forEach(id => { $('converter-' + id).textContent = result.success ? result.results[id] : '—'; });
    return result.success;
  };
  $('converter-input').addEventListener('input', run);
  $('converter-input').addEventListener('keydown', event => { if (event.key === 'Enter') run(); });
  ['converter-from-base', 'converter-prefix', 'converter-uppercase', 'converter-group'].forEach(id => $(id).addEventListener('change', run));
  $('converter-convert').addEventListener('click', () => { const success = run(); feedback(success ? '每一位，都转换好了' : '请输入有效整数', !success); });
  $('converter-clear').addEventListener('click', () => { $('converter-input').value = ''; run(); $('converter-input').focus(); });
}
function initPasswordGenerator() {
  const input = $('password-length');
  const range = $('password-length-range');
  const output = $('password-output');
  const types = ['uppercase', 'lowercase', 'digits', 'symbols'];
  input.min = range.min = passwordGenerator.minLength;
  input.max = range.max = passwordGenerator.maxLength;
  input.value = range.value = passwordGenerator.defaultLength;
  const clearResult = () => {
    output.textContent = '点击生成，一串新密码就准备好了。';
    output.classList.add('empty');
    $('password-count').textContent = '0 字符';
    $('password-copy').disabled = true;
    $('password-status').textContent = '等待生成';
    $('password-generate').textContent = '✧ 生成密码';
  };
  const validate = () => {
    const lengthValid = Number.isInteger(input.valueAsNumber) && input.valueAsNumber >= passwordGenerator.minLength && input.valueAsNumber <= passwordGenerator.maxLength;
    const typesValid = types.some(type => $('password-' + type).checked);
    input.setAttribute('aria-invalid', String(!lengthValid));
    $('password-types').setAttribute('aria-invalid', String(!typesValid));
    $('password-error').textContent = !lengthValid ? '密码长度需要是 ' + passwordGenerator.minLength + '–' + passwordGenerator.maxLength + ' 之间的整数。' : !typesValid ? '请至少选择一种字符类型。' : '';
    return lengthValid && typesValid;
  };
  const changed = () => { clearResult(); validate(); };
  input.addEventListener('input', () => {
    const length = input.valueAsNumber;
    if (Number.isInteger(length) && length >= passwordGenerator.minLength && length <= passwordGenerator.maxLength) range.value = length;
    changed();
  });
  range.addEventListener('input', () => { input.value = range.value; changed(); });
  types.forEach(type => $('password-' + type).addEventListener('change', changed));
  ['password-ambiguous', 'password-exclude', 'password-batch'].forEach(id => $(id).addEventListener('input', changed));
  $('password-form').addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    if (!validate()) {
      feedback('请检查密码长度与字符类型', true, false);
      return;
    }
    const options = Object.fromEntries(types.map(type => [type, $('password-' + type).checked]));
    options.exclude = $('password-exclude').value;
    options.avoidAmbiguous = $('password-ambiguous').checked;
    const count = Number($('password-batch').value);
    if (!Number.isInteger(count) || count < 1 || count > 100) { $('password-error').textContent = '生成数量必须是 1–100 的整数。'; return; }
    const results = Array.from({ length: count }, () => passwordGenerator.generate(input.valueAsNumber, options));
    const result = results.find(item => !item.success) || { success: true, result: results.map(item => item.result).join('\n') };
    if (!result.success) {
      $('password-error').textContent = result.error;
      feedback('密码生成失败，请重试', true, false);
      return;
    }
    output.textContent = result.result;
    output.classList.remove('empty');
    $('password-count').textContent = result.result.length + ' 字符';
    $('password-copy').disabled = false;
    $('password-status').textContent = '已生成 ' + count + ' 个 ' + input.valueAsNumber + ' 位密码';
    $('password-generate').textContent = '↻ 重新生成';
    feedback('新密码准备好了');
  });
  clearResult();
}
initShell();
closeSelects = initSelects();
initJson(); initTimestamp(); initEncoder(); initColors(); initConverter(); initPasswordGenerator();
showTool(location.hash.slice(1) || pref.get('candy-tool', 'json'));
async function restoreTransfer(state) {
  if (!state) return;
  state.fields.forEach(saved => {
    const el = $(saved.id); if (!el) return;
    el.value = saved.value; if (el.type === 'checkbox') el.checked = saved.checked;
  });
  state.fields.forEach(saved => {
    const el = $(saved.id); if (!el) return;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
  });
  // Restore input again after listeners that normalize values or invalidate outputs.
  state.fields.forEach(saved => { if ($(saved.id)) $(saved.id).value = saved.value; });
  state.outputs.forEach(saved => { if ($(saved.id)) $(saved.id).textContent = saved.text; });
  $('encode-copy').disabled = !$('encode-output').value;
  $('encode-swap').disabled = !$('encode-output').value;
  $('password-copy').disabled = !state.outputs.find(saved => saved.id === 'password-output' && !saved.text.startsWith('点击生成'));
  if (!$('password-copy').disabled) $('password-output').classList.remove('empty');
  showTool(state.tool);
  if (state.tree) $('json-tree-view').click();
  if (state.jsonResult) $('json-input').dispatchEvent(new CustomEvent('candy-restore-result', { detail: state.jsonResult }));
  feedback('已接收一次性编辑状态，不保存草稿');
}
if (document.body.classList.contains('fullpage-view')) {
  if (globalThis.chrome?.runtime?.sendMessage) chrome.runtime.sendMessage({ type: 'candy-transfer' }).then(restoreTransfer).catch(() => {});
  else if (window.opener) {
    const opener = window.opener;
    const receive = event => {
      if (event.origin !== location.origin || event.source !== opener || event.data?.type !== 'candy-transfer') return;
      window.removeEventListener('message', receive); window.opener = null; restoreTransfer(event.data.state);
    };
    window.addEventListener('message', receive); opener.postMessage('candy-ready', location.origin);
    setTimeout(() => { window.removeEventListener('message', receive); window.opener = null; }, 30000);
  }
}
