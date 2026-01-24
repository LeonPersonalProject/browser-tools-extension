# 浏览器开发者工具箱

一个轻量级、用户友好的 Chrome/Firefox 浏览器扩展，集成四个常用开发者工具。

## 功能特性

### 1. JSON 格式化与校验
- ✅ JSON 美化（2 空格缩进）
- ✅ 语法高亮显示
- ✅ 实时错误校验
- ✅ JSON 压缩（单行格式）
- ✅ 一键复制结果

### 2. 时间戳转换器
- ✅ 时间戳 ↔ 日期时间双向转换
- ✅ 自动识别秒/毫秒时间戳
- ✅ 显示本地时间和 UTC 时间
- ✅ 一键获取当前时间戳
- ✅ 点击结果即可复制

### 3. 编码/解密工具集
- ✅ Base64 编码/解码
- ✅ URL 编码/解码
- ✅ HTML 实体编码/解码
- ✅ Unicode 转义编码/解码
- ✅ 智能错误提示

### 4. 颜色取色器
- ✅ 可视化颜色选择
- ✅ 实时显示 HEX、RGB、HSL 格式
- ✅ 支持手动输入 HEX 值
- ✅ 点击任意格式即可复制

## 技术栈

- 纯 HTML5 + CSS3
- 原生 JavaScript (ES6+)
- 无任何外部依赖
- 完全离线运行

## 安装方法

### Chrome 浏览器
1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-tool-extension` 文件夹

### Firefox 浏览器
1. 打开 Firefox，访问 `about:debugging#/runtime/this-firefox`
2. 点击"临时加载附加组件"
3. 选择 `browser-tool-extension/manifest.json` 文件

## 项目结构

```
browser-tool-extension/
├── manifest.json          # 扩展清单文件
├── popup.html             # 主界面
├── popup.css              # 深色主题样式
├── popup.js               # 主逻辑和路由
├── utils/
│   ├── jsonFormatter.js   # JSON 格式化模块
│   ├── timestamp.js       # 时间戳转换模块
│   ├── encoder.js         # 编码解密模块
│   └── colorPicker.js     # 颜色取色器模块
└── assets/
    └── icon-128.png       # 扩展图标（需自行添加）
```

## 使用说明

### JSON 格式化
1. 切换到"JSON"标签
2. 粘贴 JSON 字符串到输入框
3. 点击"格式化"查看美化结果
4. 点击"压缩"转为单行格式
5. 点击输出区域即可复制

### 时间戳转换
1. 切换到"时间戳"标签
2. 输入时间戳或日期时间
3. 自动显示转换结果
4. 点击"当前时间"获取当前时间戳
5. 点击任意结果值即可复制

### 编码工具
1. 切换到"编码"标签
2. 选择编码类型（Base64/URL/HTML/Unicode）
3. 在左侧输入框输入文本
4. 点击"编码"或"解码"按钮
5. 右侧显示结果，点击即可复制

### 颜色取色器
1. 切换到"颜色"标签
2. 点击颜色预览块选择颜色
3. 或手动输入 HEX 值
4. 自动显示 HEX、RGB、HSL 格式
5. 点击任意格式即可复制

## 注意事项

### 图标文件
项目需要一个 128x128 的 PNG 图标文件，请将其放置在 `assets/icon-128.png`。

你可以：
1. 使用在线工具生成图标（如 https://www.favicon-generator.org/）
2. 使用设计软件创建 128x128 的图标
3. 临时使用任意 PNG 图片（会自动缩放）

### 浏览器兼容性
- Chrome 88+
- Firefox 89+
- Edge 88+

## 开发说明

### 模块化设计
每个工具都是独立的 ES6 模块，便于维护和扩展：
- `jsonFormatter.js` - JSON 处理逻辑
- `timestamp.js` - 时间戳转换逻辑
- `encoder.js` - 编码解密逻辑
- `colorPicker.js` - 颜色处理逻辑

### 添加新功能
1. 在 `utils/` 目录创建新模块
2. 在 `popup.html` 添加新标签页
3. 在 `popup.js` 导入模块并初始化
4. 在 `popup.css` 添加样式

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
