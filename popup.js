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
  if (!text || text === '—') { feedback('还没有可复制的结果', true); return; }
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
  let collapsed = pref.get('candy-sidebar', innerWidth < 650 ? 'collapsed' : 'expanded') === 'collapsed';
  const applySidebar = () => {
    closeSelects?.();
    document.body.classList.toggle('sidebar-collapsed', collapsed);
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
  const dialog = $('settings-panel');
  $('settings-btn').addEventListener('click', () => { closeSelects(); dialog.showModal(); });
  $('close-settings').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { closeSelects(); $('settings-btn').focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  } });
  $('fullscreen-btn').addEventListener('click', () => {
    const url = new URL('fullpage.html', location.href);
    url.hash = currentTool;
    if (globalThis.chrome?.tabs?.create) chrome.tabs.create({ url: url.href }); else window.open(url.href, '_blank', 'noopener');
  });
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
    $('json-output').innerHTML = tree ? jsonFormatter.renderCollapsible(parsed) : jsonFormatter.syntaxHighlight(formatted);
    $('json-code-view').setAttribute('aria-pressed', String(!tree));
    $('json-tree-view').setAttribute('aria-pressed', String(tree));
    $('json-lines').textContent = formatted.split('\n').length + ' 行';
    $('json-status').textContent = '✓ 校验通过';
    $('json-copy').disabled = false;
    $('json-export').disabled = false;
  };
  const run = (compress = false, announce = true) => {
    clearResult();
    $('json-error').textContent = '';
    if (!input.value.trim()) {
      $('json-error').textContent = '先粘贴一些 JSON，或点“试个例子”。';
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    const indent = $('json-indent').value === 'tab' ? '\t' : Number($('json-indent').value);
    const result = jsonFormatter.format(input.value, compress ? 0 : indent, $('json-sort').checked);
    input.setAttribute('aria-invalid', String(!result.success));
    if (!result.success) {
      $('json-error').textContent = result.error;
      feedback('请检查 JSON 格式', true, false);
      return false;
    }
    formatted = result.result; parsed = result.parsed;
    render();
    if (announce) feedback(compress ? '已压缩 JSON' : '整理好啦');
    return true;
  };
  const changed = () => {
    $('json-input-count').textContent = input.value.length.toLocaleString() + ' 字符';
    $('json-error').textContent = '';
    input.removeAttribute('aria-invalid');
    clearResult();
  };
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
  $('json-code-view').addEventListener('click', () => { tree = false; if (formatted) render(); else $('json-code-view').setAttribute('aria-pressed', 'true'); $('json-tree-view').setAttribute('aria-pressed', 'false'); });
  $('json-tree-view').addEventListener('click', () => { tree = true; $('json-tree-view').setAttribute('aria-pressed', 'true'); $('json-code-view').setAttribute('aria-pressed', 'false'); if (formatted) render(); });
  const search = () => {
    if (!formatted && !run(false, false)) return;
    const query = $('json-search').value.trim();
    const matches = jsonFormatter.search(parsed, query);
    $('json-search-result').hidden = false;
    $('json-search-result').textContent = !query ? '输入键名、点路径或 JSON Pointer 开始查找。' : matches.length ? matches.map(match => match.path + '\n' + JSON.stringify(match.value, null, 2)).join('\n\n') + (matches.length === 100 ? '\n最多展示 100 条匹配。' : '') : '没有找到匹配的键或路径。';
  };
  $('json-search-btn').addEventListener('click', search);
  $('json-search').addEventListener('keydown', event => { if (event.key === 'Enter') search(); });
  $('json-export').addEventListener('click', () => { if (formatted || run(false, false)) download(formatted, 'formatted.json'); });
  const readFile = async file => {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('请选择 5 MB 以内的文件。');
      input.value = await file.text(); changed(); run();
    } catch (error) { $('json-error').textContent = '导入失败：' + error.message; }
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
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['utils/jsonCore.js'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: data => { globalThis.__candyModalData = data; }, args: [{ input: input.value, theme: root.dataset.theme, motion: root.dataset.motion, styles, modalStyles }] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['json-modal-inject.js'] });
      feedback('已在当前网页打开 JSON 大窗口');
    } catch (error) { feedback(error.message || '大窗口打开失败', true); }
  });
  clearResult();
}

function initTimestamp() {
  let last = null;
  let source = 'timestamp';
  const zone = () => $('timestamp-zone').value;
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
    source = 'timestamp'; convert(); feedback('此刻已捕获');
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
    const result = converter.convertToAll(text, $('converter-from-base').value, $('converter-prefix').checked, $('converter-uppercase').checked);
    $('converter-error').textContent = text.trim() && !result.success ? result.error : '';
    $('converter-input').setAttribute('aria-invalid', String(Boolean(text.trim() && !result.success)));
    ids.forEach(id => { $('converter-' + id).textContent = result.success ? result.results[id] : '—'; });
    return result.success;
  };
  $('converter-input').addEventListener('input', run);
  $('converter-input').addEventListener('keydown', event => { if (event.key === 'Enter') run(); });
  ['converter-from-base', 'converter-prefix', 'converter-uppercase'].forEach(id => $(id).addEventListener('change', run));
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
  $('password-form').addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    if (!validate()) {
      feedback('请检查密码长度与字符类型', true, false);
      return;
    }
    const options = Object.fromEntries(types.map(type => [type, $('password-' + type).checked]));
    const result = passwordGenerator.generate(input.valueAsNumber, options);
    if (!result.success) {
      $('password-error').textContent = result.error;
      feedback('密码生成失败，请重试', true, false);
      return;
    }
    output.textContent = result.result;
    output.classList.remove('empty');
    $('password-count').textContent = result.result.length + ' 字符';
    $('password-copy').disabled = false;
    $('password-status').textContent = '已生成 ' + result.result.length + ' 位密码';
    $('password-generate').textContent = '↻ 重新生成';
    feedback('新密码准备好了');
  });
  clearResult();
}
initShell();
closeSelects = initSelects();
initJson(); initTimestamp(); initEncoder(); initColors(); initConverter(); initPasswordGenerator();
showTool(location.hash.slice(1) || pref.get('candy-tool', 'json'));
