# 开发者工具箱 · 软糖实验室

一个无外部运行时依赖的 Manifest V3 浏览器扩展，集成 JSON、时间戳、编码、颜色、进制和随机密码六个工具。输入在本机处理，不自动保存或上传。

## 界面

- 草莓牛奶浅色、莓果夜游深色及跟随系统三种主题。
- 左侧导航支持展开 / 收起，记住上次选择；窄屏展开时覆盖内容。
- 六位 CSS 小伙伴、纸张便签、实体投影，以及响应操作的弹跳、切页、交换和成功星星动画。
- 完整设计下拉框及展开菜单、文本框、复选框、滑块、开关、按钮、错误和键盘焦点状态。
- 动画可关闭，同时尊重系统的“减弱动态效果”。
- 800 × 600 Popup 和自适应独立页共享组件；较长内容在工作区滚动。

## 六个工具

| 工具 | 功能 |
| --- | --- |
| JSON | 2 / 4 空格或 Tab 缩进、压缩、递归排序、代码 / 可折叠树形视图、键名及路径查找、文件导入 / 拖入 / 导出、当前网页大窗口 |
| 时间戳 | 秒 / 毫秒自动识别及手动选择、本地 / UTC / 上海 / 东京 / 纽约 / 伦敦时区、ISO 8601、日期差、时间加减 |
| 编码 | UTF-8 Base64、Base64URL、URL、HTML 实体、Unicode、JWT Header / Payload 解析、交换输入输出 |
| 颜色 | HEX 3 / 4 / 6 / 8 位、RGB(A)、HSL(A)、透明度、取色器、最近颜色、前景 / 背景对比度 |
| 进制 | BigInt 精确转换二 / 八 / 十 / 十六进制、负数、进制前缀、十六进制大小写 |
| 随机密码 | 4–128 位长度、滑块 / 数字输入、大写 / 小写 / 数字 / 符号独立选择、加密随机生成、一键复制 |

所有结果通过明确的复制按钮复制，选择结果文字不会触发复制。JSON 和编码输入框支持 Ctrl / ⌘ + Enter。

## 安装与开发

无需安装 npm 包或构建。使用当前稳定版浏览器：

1. Chrome / Edge：打开扩展管理页，启用开发者模式，选择“加载已解压的扩展程序”，选择本目录。
2. Firefox：在 about:debugging#/runtime/this-firefox 选择“临时载入附加组件”，选择 manifest.json。不同版本对 MV3 和扩展 API 的支持可能不同，以实际测试为准。
3. 修改后在扩展管理页重新加载，并重新打开 Popup。

屏幕取色需要浏览器支持 EyeDropper；不支持时可使用普通颜色选择器。JSON 网页大窗口仅适用于允许扩展注入的普通 HTTP(S) 网页；浏览器内部页不能注入。

## 数据与权限

- 仅保存主题、侧栏状态、动画偏好、最近使用的工具和最近 8 个颜色。
- 不自动保存 JSON、JWT、编码文本、时间或转换输入。
- 随机密码仅使用浏览器加密随机源生成，不保存或上传；每种已选字符类型至少出现一次。
- 保留现有权限：clipboardWrite、activeTab、scripting 与 <all_urls>，本次未新增权限。
- JWT 只做解析，**未验证签名**，结果不能用于认证判断。

## 项目结构

- popup.html / fullpage.html：两个入口。
- popup.css / fullpage.css：共享设计令牌、组件及独立页布局。
- popup.js：导航、偏好、界面与工具事件。
- utils/appView.js / controls.js：共享页面与键盘可操作的自定义选择器。
- utils/jsonCore.js / jsonFormatter.js：共享 JSON 逻辑及模块入口。
- utils/timestamp.js、encoder.js、colorPicker.js、converter.js、passwordGenerator.js：工具逻辑。
- json-modal-inject.js / .css：Shadow DOM 隔离的网页大窗口。
- assets/icon-128.png：扩展图标。

详细使用、边界说明及验证步骤见 [DOCS.md](DOCS.md)，变更见 [CHANGELOG.md](CHANGELOG.md)。

## 检查

- git diff --check
- python3 -m json.tool manifest.json
- 检查 Popup 和独立页、两种主题、侧栏两种状态、所有控件、剪贴板、无效输入、网页大窗口与控制台。

## 许可证

MIT License
