export const tools = {
  json: ['JSON 格式化', 'JSON', '把杂乱的数据，整理成小秩序。', '乱一点也没关系'],
  timestamp: ['时间戳转换', '时间戳', '给每一个瞬间，找到准确的坐标。', '此刻，刚刚好'],
  encoder: ['编码与解码', '编码解码', '换一种语言，信息依然可爱。', '秘密交给我'],
  color: ['颜色实验室', '颜色', '收集好看的颜色，也照顾每一份可读性。', '今天也要有颜色'],
  converter: ['进制转换', '进制转换', '数字换个模样，精度一点也不少。', '大数字，也拿手'],
  password: ['密码随机生成器', '随机密码', '长度和字符由你选，随机的事交给我。', '给秘密加把锁']
};
export const mascot = type => `<span class="pal pal-${type}" aria-hidden="true"><span class="ear ear-one"></span><span class="ear ear-two"></span><span class="eyes"></span><span class="mouth"></span><span class="cheeks"></span>${type === 'json' ? '<span class="pal-symbol">{ }</span>' : ''}</span>`;
const btn = (id, text, primary = false) => `<button type="button" id="${id}" class="${primary ? 'primary-button' : 'soft-button'}">${text}</button>`;
const field = (id, text, placeholder = '', extra = '') => `<label class="field" for="${id}"><span>${text}</span><input id="${id}" placeholder="${placeholder}" ${extra}></label>`;
const select = (id, text, opts) => `<label class="field" for="${id}"><span>${text}</span><select id="${id}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
const check = (id, text, on = false) => `<label class="check"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${text}</span></label>`;
const error = id => `<p class="error" id="${id}" role="status" aria-live="polite"></p>`;
const result = (id, text) => `<div class="result-row"><span>${text}</span><output id="${id}">—</output><button type="button" class="copy-button" data-copy="${id}" aria-label="复制${text}" title="复制${text}">⧉</button></div>`;
function jsonView() {
  return `<section class="page" id="json-page" aria-labelledby="page-title"><div class="toolbar">${select('json-indent', '缩进', [['2', '2 空格'], ['4', '4 空格'], ['tab', 'Tab']])}${check('json-sort', '递归排序')}<div class="toolbar-actions">${btn('json-import', '↥ 导入')}${btn('json-export', '↧ 导出')}${btn('json-modal', '网页内 JSON 窗口')}</div>
    <input type="file" id="json-file" accept=".json,.txt,application/json,text/plain" hidden></div>
    <p class="notice">网页内窗口的内容可能被所在网页访问；敏感数据请用顶部“独立页继续编辑”。输入和文件上限 5 MiB，不自动实时解析。</p><div class="json-workspace two-columns"><div class="source-column"><article class="paper source-paper" id="json-drop"><span class="paper-tab">原始小纸条</span><div class="paper-heading"><label for="json-input">输入 JSON / Python 字典</label><button type="button" id="json-example" class="text-button">试个例子</button></div>
    <textarea id="json-input" class="code-input" spellcheck="false" placeholder="粘贴数据，或把 JSON 文件拖到这里…"></textarea><div class="paper-foot"><span id="json-input-count">0 字符</span><button type="button" id="json-clear" class="text-button">清空</button></div>
    </article>
    <div class="actions">${btn('json-format', '✧ 格式化', true)}${btn('json-compress', '压缩')}<span class="shortcut">Ctrl / ⌘ ↵</span></div>
    </div><article class="paper result-paper"><div class="paper-heading"><div class="segmented" role="group" aria-label="结果视图"><button type="button" id="json-code-view" aria-pressed="true">代码</button><button type="button" id="json-tree-view" aria-pressed="false">树形</button></div>
    <button type="button" id="json-copy" class="copy-button">⧉ 复制</button></div>
    <div class="actions">${btn('json-expand', '全部展开')}${btn('json-collapse', '全部收起')}</div><div id="json-output" class="code-output empty" tabindex="0">整理好的 JSON 会出现在这里</div>
    <div class="paper-foot"><span id="json-status">等待输入</span><span id="json-lines">0 行</span></div>
    </article>
    </div>${error('json-error')}<div class="search-row"><label class="sr-only" for="json-search">查找键或路径</label><input type="search" id="json-search" placeholder="查找键 / 路径，如 user.name、/user/name">${btn('json-search-btn', '查找')}</div>
    <pre id="json-search-result" class="search-result" aria-live="polite" hidden></pre>
  </section>`;
}
function timeView() {
  return `<section class="page" id="timestamp-page" aria-labelledby="page-title" hidden><div class="time-layout two-columns"><div class="time-source"><div class="pal-note">${mascot('timestamp')}<span>秒还是毫秒？<br>让我来认一认。</span></div>${field('timestamp-input', 'Unix 时间戳', '例如 1700000000', 'inputmode="numeric" spellcheck="false"')}<div class="time-selects">${select('timestamp-unit', '输入单位', [['auto', '自动识别'], ['s', '秒（s）'], ['ms', '毫秒（ms）']])}${btn('timestamp-now', '此刻时间', true)}</div>${field('datetime-input', '日期时间（使用所选时区）', '2026-11-10 12:00:00', 'spellcheck="false"')}<div class="actions">${btn('datetime-convert', '日期 → 时间戳')}</div>
    </div><article class="paper time-ticket"><div class="ticket-heading"><strong>时间小票</strong><span aria-hidden="true">✷</span></div>${select('timestamp-zone', '显示与输入时区', [['local', '本地时区'], ['UTC', 'UTC'], ['Asia/Shanghai', '上海 · UTC+8'], ['Asia/Tokyo', '东京 · UTC+9'], ['America/New_York', '纽约'], ['Europe/London', '伦敦']])}${field('timestamp-custom-zone', '自定义 IANA 时区（优先使用）', '例如 Asia/Kathmandu', 'spellcheck="false"')}<output id="local-time" class="time-date">等待一个瞬间</output><p id="timestamp-detected" class="muted">自动识别可手动覆盖</p><div class="ticket-divider"></div>${result('utc-time', 'UTC')}${result('timestamp-iso', 'ISO 8601')}${result('timestamp-sec', '秒')}${result('timestamp-ms', '毫秒')}</article>
    </div>${error('timestamp-error')}
    <details class="extra-tools paper"><summary>时间加减与日期差 <span>再多算一步</span></summary><div class="extra-body"><div class="inline-fields">${field('time-start', '开始时间', '2026-11-10 00:00:00')}${field('time-end', '结束时间', '2026-11-11 12:00:00')}${btn('time-diff', '计算时间差')}</div>
    <output id="time-diff-result" class="calculation-result" aria-live="polite"></output><div class="inline-fields">${field('time-amount', '在当前结果上加减', '可输入负数', 'type="number" value="1"')}${select('time-add-unit', '单位（实际经过时长）', [['86400000', '天 · 每天 24 小时'], ['3600000', '小时'], ['60000', '分钟'], ['1000', '秒']])}${btn('time-add', '计算')}</div>
    <output id="time-add-result" class="calculation-result" aria-live="polite"></output></div>
    </details>
  </section>`;
}
function encoderView() {
  return `<section class="page" id="encoder-page" aria-labelledby="page-title" hidden><div class="toolbar">${select('encode-type', '转换方式', [['base64', 'Base64 · UTF-8'], ['base64url', 'Base64URL'], ['url', 'URL 组件 · 编码所有分隔符'], ['urlFull', '完整 URL · 保留 : / ? & = #'], ['html', 'HTML 实体'], ['unicode', 'Unicode 转义'], ['jwt', 'JWT 解析']])}<span class="toolbar-hint">让信息换个模样</span></div>
    <p class="notice" id="jwt-notice" hidden>仅解析 Header / Payload，未验证签名；不能据此信任令牌。</p><div class="encode-workspace two-columns"><article class="paper source-paper"><span class="paper-tab mint-tab">寄出的小纸条</span><div class="paper-heading"><label for="encode-input">输入文本</label><button id="encode-clear" type="button" class="text-button">清空</button></div>
    <div class="actions encode-actions">${btn('encode-btn', '编码', true)}${btn('decode-btn', '解码')}${btn('encode-swap', '交换内容')}</div><textarea id="encode-input" class="code-input" spellcheck="false" placeholder="你好，世界 🍬"></textarea><div class="paper-foot"><span id="encode-input-count">0 字符</span><span>UTF-8 友好</span></div>
    </article>
    <article class="paper encoded-paper"><span class="paper-tab grape-tab">收到的小纸条</span><div class="paper-heading"><label for="encode-output">转换结果</label><button type="button" id="encode-copy" class="copy-button">⧉ 复制</button></div>
    <textarea readonly id="encode-output" class="code-input" spellcheck="false" placeholder="转换后，在这里拆信"></textarea><div class="paper-foot"><span id="encode-output-count">0 字符</span><span>可直接选择文字</span></div>
    </article>
    </div>
    ${error('encode-error')}
  </section>`;
}
function colorView() {
  return `<section class="page" id="color-page" aria-labelledby="page-title" hidden><div class="color-layout two-columns"><article class="paper color-card"><div class="color-preview checkerboard" id="color-preview"><div id="color-fill"></div>
    <label class="color-picker-label" for="color-input">点一下，挑个颜色 ✷</label><input type="color" id="color-input" value="#f5a7c1" aria-label="选择颜色"></div>
    <div class="color-card-caption"><strong id="color-card-hex">#F5A7C1</strong>${btn('color-eyedropper', '⌖ 屏幕取色')}</div>
    </article>
    <div class="color-values">${field('hex-input', '输入 HEX / RGB(A) / HSL(A)', '#f5a7c1', 'value="#f5a7c1" spellcheck="false"')}<label class="field range-field" for="color-alpha"><span>不透明度 <output id="color-alpha-value">100%</output></span><input type="range" min="0" max="100" value="100" id="color-alpha"></label><div class="format-values">${result('hex-value', 'HEX')}${result('rgb-value', 'RGB')}${result('hsl-value', 'HSL')}</div>
    <div class="history-heading">最近的颜色 <span>仅在本机保存</span></div>
    <div id="color-history" class="color-history" aria-label="最近使用的颜色"></div>
    </div></div>${error('color-error')}<article class="paper contrast-card"><div><strong>颜色也要看得清</strong><p class="muted">以前景为当前颜色；透明背景先合成到白色。</p>${field('contrast-background', '背景颜色', '#ffffff', 'value="#ffffff" spellcheck="false"')}</div>
    <div id="contrast-preview" class="contrast-preview"><span>Aa</span><span>每个字，都清楚</span></div>
    <div class="contrast-score"><strong id="contrast-ratio">—</strong><span id="contrast-rating">等待计算</span></div>
    </article>

  </section>`;
}
function converterView() {
  return `<section class="page" id="converter-page" aria-labelledby="page-title" hidden><div class="number-heading">${mascot('converter')}<p>从 0 到很大的数，<br><strong>每一位都认真对待。</strong></p></div>
    <article class="paper number-source"><div class="inline-fields">${field('converter-input', '输入整数', '试试 9007199254740993', 'spellcheck="false"')}${select('converter-from-base', '输入进制', [['10', '十进制 · 10'], ['2', '二进制 · 2'], ['8', '八进制 · 8'], ['16', '十六进制 · 16']])}${btn('converter-convert', '✧ 转换', true)}</div>
    <div class="number-options">${check('converter-prefix', '显示进制前缀', true)}${check('converter-uppercase', '十六进制大写', true)}${check('converter-group', '分组显示（复制含空格）')}<button type="button" id="converter-clear" class="text-button">清空</button></div>
    </article>${error('converter-error')}<div class="number-results">${[['binary', '二进制', '2'], ['octal', '八进制', '8'], ['decimal', '十进制', '10'], ['hexadecimal', '十六进制', '16']].map(([id, text, base]) => `<article class="number-strip strip-${base}"><span class="base-badge">${base}</span><div><span class="number-label">${text}</span><output id="converter-${id}">—</output></div>
    <button type="button" class="copy-button" data-copy="converter-${id}" aria-label="复制${text}">⧉</button></article>`).join('')}</div>
    <p class="muted footnote">支持负数及 0b / 0o / 0x 前缀；只处理整数，使用 BigInt 保持精度。</p>
  </section>`;
}
function passwordView() {
  return `<section class="page" id="password-page" aria-labelledby="page-title" hidden><div class="password-layout two-columns"><form id="password-form" class="paper password-settings" novalidate><div class="paper-heading"><strong>定制你的密码</strong><span class="muted">4–128 位</span></div>
    <div class="password-settings-body">${field('password-length', '密码长度', '', 'type="number" min="4" max="128" step="1" value="16" inputmode="numeric" aria-describedby="password-error"')}<label class="sr-only" for="password-length-range">拖动调整密码长度</label><input type="range" id="password-length-range" min="4" max="128" step="1" value="16">
    <fieldset id="password-types" class="password-types" aria-describedby="password-types-help password-error"><legend>包含哪些字符</legend>${check('password-uppercase', '大写字母 A–Z', true)}${check('password-lowercase', '小写字母 a–z', true)}${check('password-digits', '数字 0–9', true)}${check('password-symbols', '符号 !@#$…', true)}</fieldset>
    ${check('password-ambiguous', '排除易混字符 Il1O0o|')}${field('password-exclude', '自定义排除字符', '例如 {}[]')}${field('password-batch', '生成数量（1–100）', '', 'type="number" min="1" max="100" value="1"')}<button type="submit" id="password-generate" class="primary-button">生成密码</button><p id="password-types-help" class="muted">每种勾选的字符，至少包含一个。</p></div></form>
    <article class="paper password-result"><span class="paper-tab mint-tab">新鲜出炉的密码</span><div class="paper-heading"><label for="password-output">生成结果</label><span id="password-count" class="muted">0 字符</span></div>
    <output id="password-output" class="password-output empty" tabindex="0" aria-live="off">点击生成，一串新密码就准备好了。</output><div class="password-actions"><button type="button" id="password-copy" class="soft-button" data-copy="password-output" disabled>⧉ 复制</button></div>
    <div class="paper-foot"><span id="password-status" role="status" aria-live="polite">等待生成</span><span>仅在本机处理</span></div></article></div>${error('password-error')}<p class="muted footnote">使用浏览器加密随机源，不保存或上传密码。</p>
  </section>`;
}
export function appView() {
  return `<div class="app-shell"><aside class="sidebar" aria-label="工具导航"><a class="brand" href="#json" aria-label="开发者工具箱首页">${mascot('brand')}<span class="brand-type"><strong>软糖实验室</strong><span>开发者工具箱</span></span></a><button type="button" id="nav-toggle" class="nav-toggle" aria-controls="tools-nav" aria-expanded="true" aria-label="收起侧边栏" title="收起侧边栏"><span class="toggle-glyph" aria-hidden="true">‹</span><span class="nav-text">收起侧栏</span></button><nav id="tools-nav">${Object.entries(tools).map(([id, tool]) => `<button type="button" class="tool-nav-item" data-tool="${id}" title="${tool[0]}" aria-label="${tool[0]}">${mascot(id)}<span class="nav-text">${tool[1]}</span><span class="nav-active-dot" aria-hidden="true"></span></button>`).join('')}</nav><div class="sidebar-foot"><span aria-hidden="true">✦</span><span class="nav-text">六位小伙伴<br>随叫随到</span></div>
    </aside>
    <div class="main-shell"><header class="topbar"><span class="brand-greet">给开发日常，加一点甜。</span><div class="header-actions"><button type="button" id="theme-quick" class="icon-button" aria-label="切换明暗主题" title="切换明暗主题">◐</button><button type="button" id="motion-btn" class="icon-button" aria-pressed="true" aria-label="开关动画" title="开关动画">✧</button><button type="button" id="fullscreen-btn" class="icon-button" aria-label="在独立页打开" title="在独立页打开">⛶</button><button type="button" id="settings-btn" class="icon-button" aria-haspopup="dialog" aria-label="打开设置" title="设置">⚙</button></div>
    </header>
    <main class="tools-content"><div class="page-heading"><div><h1 id="page-title">JSON 格式化</h1><p id="page-description">把杂乱的数据，整理成小秩序。</p></div>
    <div class="mood-sticker" aria-hidden="true"><span>✷</span><span id="mood-text">乱一点也没关系</span></div>
    </div>${jsonView()}${timeView()}${encoderView()}${colorView()}${converterView()}${passwordView()}<footer class="workspace-footer"><span>本地处理 · 不上传输入内容</span><span>一点灵感，一点效率。</span></footer></main></div>
    </div><button id="nav-overlay" class="nav-overlay" aria-label="关闭导航" hidden></button><div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div class="sparkles" aria-hidden="true"></div>
    <dialog id="settings-panel" aria-labelledby="settings-title"><div class="dialog-heading"><h2 id="settings-title">给实验室换个心情</h2><button type="button" id="close-settings" class="icon-button" aria-label="关闭设置">×</button></div>${field('editor-size', '编辑字号（12–24）', '', 'type="number" min="12" max="24" value="14"')}${select('workspace-mode', '编辑布局', [['both', '并排'], ['input', '只看输入'], ['result', '只看结果']])}${field('column-ratio', '输入栏宽度（30–70%）', '', 'type="range" min="30" max="70" value="50"')}${select('theme-mode', '主题', [['light', '草莓牛奶 · 浅色'], ['dark', '莓果夜游 · 深色'], ['system', '跟随系统']])}<label class="switch-field" for="motion-toggle"><span>小伙伴与交互动画<small>同时尊重系统的减弱动态效果设置</small></span><input id="motion-toggle" type="checkbox" role="switch" checked></label><p class="muted">仅保存主题、侧栏、最近使用的工具和颜色，不自动保存输入内容。</p></dialog>`;
}
