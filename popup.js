// 主逻辑 - 页面导航和功能路由
console.log('=== popup.js 开始加载 ===');
console.log('当前 URL:', window.location.href);

// 只在popup页面设置固定尺寸，fullpage页面使用CSS的vw/vh
const isFullpage = window.location.pathname.includes('fullpage.html');
console.log('是否为全屏页面:', isFullpage);

if (!isFullpage) {
  // 设置popup为浏览器允许的最大尺寸
  // Chrome/Edge最大约800x600，我们设置为这个安全值
  try {
    document.body.style.width = '800px';
    document.body.style.height = '600px';
    document.body.style.minHeight = '600px';
    document.body.style.maxHeight = '600px';

    console.log('✓ 已设置popup为最大尺寸: 800x600');
  } catch (e) {
    console.error('设置popup尺寸失败:', e);
  }
} else {
  console.log('✓ 全屏页面，使用CSS的80vw×80vh尺寸');
}

import { jsonFormatter } from './utils/jsonFormatter.js';
import { timestamp } from './utils/timestamp.js';
import { encoder } from './utils/encoder.js';
import { colorPicker } from './utils/colorPicker.js';

console.log('✓ 所有模块导入成功');
console.log('jsonFormatter:', jsonFormatter);
console.log('timestamp:', timestamp);
console.log('encoder:', encoder);
console.log('colorPicker:', colorPicker);

// 页面导航管理
const pageManager = {
  currentPage: 'json',

  // 页面标题映射
  pageTitles: {
    'json': 'JSON 格式化',
    'timestamp': '时间戳转换',
    'encoder': '编码解码',
    'color': '颜色取色器'
  },

  // 显示指定页面
  showPage(pageName) {
    console.log('切换到页面:', pageName);

    // 隐藏所有工具页面
    document.querySelectorAll('.tools-content .page').forEach(page => {
      page.classList.remove('active');
    });

    // 显示目标页面
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageName;

      // 更新标题
      const pageTitle = document.getElementById('page-title');
      if (pageTitle) {
        pageTitle.textContent = this.pageTitles[pageName] || '开发者工具箱';
      }

      // 更新导航激活状态
      document.querySelectorAll('.tool-nav-item').forEach(item => {
        item.classList.remove('active');
      });
      const activeNavItem = document.querySelector(`.tool-nav-item[data-tool="${pageName}"]`);
      if (activeNavItem) {
        activeNavItem.classList.add('active');
      }
    }
  }
};

// Toast 提示
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板');
  } catch (error) {
    // 降级方案
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

// 主题切换
function initTheme() {
  console.log('=== 开始初始化主题 ===');
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  console.log('themeToggle 元素:', themeToggle);
  console.log('body 元素:', body);

  if (!themeToggle) {
    console.error('❌ 找不到主题切换开关元素 #theme-toggle');
    console.log('所有 input 元素:', document.querySelectorAll('input'));
    return;
  }

  console.log('✓ 找到 theme-toggle 元素');

  // 从 localStorage 读取主题设置
  const savedTheme = localStorage.getItem('theme') || 'dark';
  console.log('保存的主题:', savedTheme);

  if (savedTheme === 'light') {
    body.classList.remove('theme-dark');
    themeToggle.checked = false;
    console.log('应用浅色主题');
  } else {
    body.classList.add('theme-dark');
    themeToggle.checked = true;
    console.log('应用深色主题');
  }

  // 监听主题切换
  themeToggle.addEventListener('change', (e) => {
    console.log('🎨 主题切换事件触发！');
    console.log('  - checked:', e.target.checked);
    console.log('  - event:', e);

    if (e.target.checked) {
      body.classList.add('theme-dark');
      localStorage.setItem('theme', 'dark');
      console.log('  → 切换到深色模式');
      showToast('已切换到深色模式');
    } else {
      body.classList.remove('theme-dark');
      localStorage.setItem('theme', 'light');
      console.log('  → 切换到浅色模式');
      showToast('已切换到浅色模式');
    }
  });

  console.log('✓ 主题切换事件监听器已绑定');
}

// 设置面板
function initSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettings = document.getElementById('close-settings');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  if (!settingsBtn || !settingsPanel || !closeSettings) {
    console.error('找不到设置面板相关元素');
    return;
  }

  settingsBtn.addEventListener('click', () => {
    console.log('打开设置面板');
    settingsPanel.classList.add('show');
  });

  closeSettings.addEventListener('click', () => {
    console.log('关闭设置面板');
    settingsPanel.classList.remove('show');
  });

  // 全屏打开按钮
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      console.log('打开全屏页面');
      chrome.tabs.create({ url: 'fullpage.html' });
    });
  }
}

// Tab 切换（工具导航项）
function initTabs() {
  console.log('=== 开始初始化工具导航 ===');
  const navItems = document.querySelectorAll('.tool-nav-item:not([disabled])');

  console.log('找到导航项数量:', navItems.length);
  console.log('导航项列表:', navItems);

  if (navItems.length === 0) {
    console.error('❌ 找不到导航项元素');
    console.log('所有 .tool-nav-item 元素:', document.querySelectorAll('.tool-nav-item'));
    return;
  }

  console.log('✓ 找到', navItems.length, '个导航项');

  navItems.forEach((item, index) => {
    const toolName = item.dataset.tool;
    console.log(`  [${index}] 导航项:`, toolName, item);

    item.addEventListener('click', () => {
      console.log('🔄 导航项被点击！');
      console.log('  - 工具:', toolName);
      console.log('  - 元素:', item);

      // 切换到对应的工具页面
      pageManager.showPage(toolName);
    });

    console.log(`  ✓ 导航项 [${toolName}] 事件监听器已绑定`);
  });

  console.log('✓ 所有导航项已绑定');

  // 初始化显示第一个页面（JSON）
  pageManager.showPage('json');
}

// JSON 格式化功能
function initJsonFormatter() {
  const input = document.getElementById('json-input');
  const output = document.getElementById('json-output');
  const errorMsg = document.getElementById('json-error');
  const formatBtn = document.getElementById('json-format');
  const compressBtn = document.getElementById('json-compress');
  const copyBtn = document.getElementById('json-copy');
  const modalBtn = document.getElementById('json-modal');
  const clearBtn = document.getElementById('json-clear');

  // 存储最后格式化的结果（纯文本）
  let lastFormattedJson = '';

  formatBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) {
      errorMsg.textContent = '请输入 JSON 字符串';
      return;
    }

    const result = jsonFormatter.format(text);
    if (result.success) {
      lastFormattedJson = result.result;
      // 使用可折叠渲染
      output.innerHTML = jsonFormatter.renderCollapsible(result.parsed);
      errorMsg.textContent = '';
      console.log('JSON 格式化成功');

      // 绑定折叠/展开事件
      bindToggleEvents();
    } else {
      errorMsg.textContent = '错误：' + result.error;
      output.textContent = '';
      lastFormattedJson = '';
    }
  });

  // 绑定折叠/展开事件
  function bindToggleEvents() {
    const toggles = output.querySelectorAll('.json-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
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
    });
  }

  compressBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) {
      errorMsg.textContent = '请输入 JSON 字符串';
      return;
    }

    const result = jsonFormatter.compress(text);
    if (result.success) {
      lastFormattedJson = result.result;
      output.textContent = result.result;
      errorMsg.textContent = '';
      console.log('JSON 压缩成功');
    } else {
      errorMsg.textContent = '错误：' + result.error;
      output.textContent = '';
      lastFormattedJson = '';
    }
  });

  // 复制按钮
  copyBtn.addEventListener('click', () => {
    if (!lastFormattedJson) {
      showToast('请先格式化或压缩 JSON');
      return;
    }
    copyToClipboard(lastFormattedJson);
  });

  // 大窗口弹窗按钮 - 注入到当前标签页（覆盖整个浏览器视口 90%）
  // 只在 popup.html 中存在，fullpage.html 中不存在
  if (modalBtn) {
    modalBtn.addEventListener('click', async () => {
    console.log('打开 JSON 大窗口（注入到页面，覆盖 90% 浏览器视口）');

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        showToast('无法获取当前标签页');
        return;
      }

      // 检查是否是特殊页面（chrome://, edge://, about:, etc.）
      if (tab.url && (
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('chrome-extension://')
      )) {
        showToast('此页面不支持大窗口功能');
        console.warn('特殊页面不支持注入:', tab.url);
        return;
      }

      // 注入 CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['json-modal-inject.css']
      });

      // 注入 JS 并传递数据
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (inputText, formattedText) => {
          window.__jsonModalData = {
            input: inputText,
            formatted: formattedText
          };
        },
        args: [input.value.trim(), lastFormattedJson]
      });

      // 注入主脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['json-modal-inject.js']
      });

      console.log('✅ JSON 大窗口已注入到页面');
    } catch (error) {
      console.error('❌ 注入失败:', error);
      showToast('打开大窗口失败: ' + error.message);
    }
    });
  }

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    errorMsg.textContent = '';
    lastFormattedJson = '';
  });

  // 点击输出区域也可以复制（但不包括折叠按钮）
  output.addEventListener('click', (e) => {
    // 如果点击的是折叠按钮或其子元素，不执行复制
    if (e.target.closest('.json-toggle')) {
      return;
    }

    if (lastFormattedJson) {
      copyToClipboard(lastFormattedJson);
    }
  });
}

// 时间戳转换功能
function initTimestamp() {
  const timestampInput = document.getElementById('timestamp-input');
  const datetimeInput = document.getElementById('datetime-input');
  const nowBtn = document.getElementById('timestamp-now');
  const localTime = document.getElementById('local-time');
  const utcTime = document.getElementById('utc-time');
  const timestampSec = document.getElementById('timestamp-sec');
  const timestampMs = document.getElementById('timestamp-ms');

  function updateDisplay(result) {
    if (result.success) {
      localTime.textContent = result.localTime;
      utcTime.textContent = result.utcTime;
      timestampSec.textContent = result.timestampSec;
      timestampMs.textContent = result.timestampMs;
    }
  }

  timestampInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (!value) return;

    const result = timestamp.timestampToDate(value);
    updateDisplay(result);

    if (result.success) {
      datetimeInput.value = result.localTime.split(' (')[0];
    }
  });

  datetimeInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (!value) return;

    const result = timestamp.dateToTimestamp(value);
    updateDisplay(result);

    if (result.success) {
      timestampInput.value = result.timestampSec;
    }
  });

  nowBtn.addEventListener('click', () => {
    const current = timestamp.getCurrentTimestamp();
    timestampInput.value = current.timestampSec;
    timestampInput.dispatchEvent(new Event('input'));
  });

  // 点击结果复制
  [localTime, utcTime, timestampSec, timestampMs].forEach(el => {
    el.addEventListener('click', () => {
      if (el.textContent !== '-') {
        copyToClipboard(el.textContent);
      }
    });
  });
}

// 编码/解密功能
function initEncoder() {
  const typeSelect = document.getElementById('encode-type');
  const input = document.getElementById('encode-input');
  const output = document.getElementById('encode-output');
  const errorMsg = document.getElementById('encode-error');
  const encodeBtn = document.getElementById('encode-btn');
  const decodeBtn = document.getElementById('decode-btn');
  const clearBtn = document.getElementById('encode-clear');

  encodeBtn.addEventListener('click', () => {
    const text = input.value;
    if (!text) {
      errorMsg.textContent = '请输入要编码的文本';
      return;
    }

    const type = typeSelect.value;
    const result = encoder.encode(type, text);

    if (result.success) {
      output.value = result.result;
      errorMsg.textContent = '';
    } else {
      errorMsg.textContent = result.error;
    }
  });

  decodeBtn.addEventListener('click', () => {
    const text = input.value;
    if (!text) {
      errorMsg.textContent = '请输入要解码的文本';
      return;
    }

    const type = typeSelect.value;
    const result = encoder.decode(type, text);

    if (result.success) {
      output.value = result.result;
      errorMsg.textContent = '';
    } else {
      errorMsg.textContent = result.error;
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    errorMsg.textContent = '';
  });

  // 点击输出区域复制
  output.addEventListener('click', () => {
    if (output.value) {
      copyToClipboard(output.value);
    }
  });
}

// 颜色取色器功能
function initColorPicker() {
  const colorInput = document.getElementById('color-input');
  const colorPreview = document.getElementById('color-preview');
  const hexInput = document.getElementById('hex-input');
  const hexValue = document.getElementById('hex-value');
  const rgbValue = document.getElementById('rgb-value');
  const hslValue = document.getElementById('hsl-value');

  function updateColorDisplay(hex) {
    const formats = colorPicker.getColorFormats(hex);
    if (!formats) return;

    colorPreview.style.background = hex;
    colorInput.value = hex;
    hexInput.value = hex;
    hexValue.textContent = formats.hex;
    rgbValue.textContent = formats.rgb;
    hslValue.textContent = formats.hsl;
  }

  // 点击预览块打开取色器
  colorPreview.addEventListener('click', () => {
    colorInput.click();
  });

  // 取色器变化
  colorInput.addEventListener('input', (e) => {
    updateColorDisplay(e.target.value);
  });

  // 手动输入 HEX
  hexInput.addEventListener('input', (e) => {
    let hex = e.target.value.trim();
    if (colorPicker.isValidHex(hex)) {
      hex = colorPicker.normalizeHex(hex);
      updateColorDisplay(hex);
    }
  });

  // 点击颜色值复制
  document.querySelectorAll('.format-item').forEach(item => {
    item.addEventListener('click', () => {
      const valueEl = item.querySelector('.format-value');
      copyToClipboard(valueEl.textContent);

      // 添加复制成功动画
      item.classList.add('copied');
      setTimeout(() => {
        item.classList.remove('copied');
      }, 600);
    });
  });

  // 初始化显示
  updateColorDisplay('#000000');
}

// 初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
  console.log('');
  console.log('========================================');
  console.log('=== DOM 内容加载完成，开始初始化扩展 ===');
  console.log('========================================');
  console.log('');
  console.log('document.readyState:', document.readyState);
  console.log('document.body:', document.body);
  console.log('');

  try {
    initTheme();
    console.log('✅ 主题初始化完成');
    console.log('');
  } catch (e) {
    console.error('❌ 主题初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initSettings();
    console.log('✅ 设置面板初始化完成');
    console.log('');
  } catch (e) {
    console.error('❌ 设置面板初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initTabs();
    console.log('✅ 工具卡片初始化完成');
    console.log('');
  } catch (e) {
    console.error('❌ 工具卡片初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initJsonFormatter();
    console.log('✅ JSON 格式化初始化完成');
  } catch (e) {
    console.error('❌ JSON 格式化初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initTimestamp();
    console.log('✅ 时间戳转换初始化完成');
  } catch (e) {
    console.error('❌ 时间戳转换初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initEncoder();
    console.log('✅ 编码工具初始化完成');
  } catch (e) {
    console.error('❌ 编码工具初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  try {
    initColorPicker();
    console.log('✅ 颜色取色器初始化完成');
  } catch (e) {
    console.error('❌ 颜色取色器初始化失败:', e);
    console.error('错误堆栈:', e.stack);
  }

  console.log('');
  console.log('========================================');
  console.log('=== 扩展初始化完成！ ===');
  console.log('========================================');
  console.log('');
});
