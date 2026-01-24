# 项目结构

```
browser-tool-extension/
├── manifest.json                 # 扩展配置文件
├── popup.html                    # 主界面 HTML
├── popup.css                     # 主界面样式
├── popup.js                      # 主界面逻辑
├── json-modal-inject.css         # JSON 大窗口样式（注入到标签页）
├── json-modal-inject.js          # JSON 大窗口脚本（注入到标签页）
├── utils/                        # 工具模块
│   ├── jsonFormatter.js          # JSON 格式化工具
│   ├── timestamp.js              # 时间戳转换工具
│   ├── encoder.js                # 编码/解密工具
│   └── colorPicker.js            # 颜色取色器工具
├── assets/                       # 资源文件
│   └── icon-128.png              # 扩展图标
├── README.md                     # 项目说明
├── CHANGELOG.md                  # 更新日志
├── INSTALL.md                    # 安装指南
└── PROJECT_SUMMARY.md            # 项目总结
```

## 核心文件说明

### 扩展配置
- **manifest.json** - Chrome 扩展配置，定义权限、图标、弹窗等

### 主界面
- **popup.html** - 扩展弹窗的 HTML 结构
- **popup.css** - 扩展弹窗的样式（包含主题切换）
- **popup.js** - 扩展弹窗的逻辑（工具切换、事件处理）

### JSON 大窗口（注入到标签页）
- **json-modal-inject.css** - 大窗口样式（90vw × 90vh，毛玻璃效果）
- **json-modal-inject.js** - 大窗口逻辑（格式化、压缩、复制等）

### 工具模块
- **utils/jsonFormatter.js** - JSON 格式化、压缩、语法高亮
- **utils/timestamp.js** - 时间戳与日期时间互转
- **utils/encoder.js** - Base64、URL、HTML、Unicode 编码
- **utils/colorPicker.js** - 颜色格式转换（HEX、RGB、HSL）

## 文件大小

| 文件 | 行数 | 说明 |
|------|------|------|
| popup.html | ~200 | 主界面结构 |
| popup.css | ~1000 | 主界面样式 |
| popup.js | ~500 | 主界面逻辑 |
| json-modal-inject.css | ~400 | 大窗口样式 |
| json-modal-inject.js | ~400 | 大窗口逻辑 |
| utils/*.js | ~100-150 | 各工具模块 |

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **扩展**: Chrome Extension Manifest V3
- **架构**: 模块化设计，无外部依赖
- **样式**: CSS 变量 + 主题切换
- **注入**: Content Script 动态注入

## 版本

- **当前版本**: v1.3.1
- **更新日期**: 2026-01-24
