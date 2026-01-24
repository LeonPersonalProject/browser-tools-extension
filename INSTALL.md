# 快速安装指南

## 第一步：准备图标文件

### 快速方法（推荐）
使用 Python 创建一个简单的占位图标：

```bash
# 如果已安装 Python 和 Pillow 库
cd browser-tool-extension/assets
python3 << 'EOF'
from PIL import Image, ImageDraw, ImageFont

# 创建 128x128 的图标
img = Image.new('RGB', (128, 128), color='#007acc')
draw = ImageDraw.Draw(img)

# 绘制简单的工具图标
draw.ellipse([32, 32, 96, 96], outline='white', width=4)
draw.rectangle([60, 20, 68, 108], fill='white')
draw.rectangle([20, 60, 108, 68], fill='white')

# 保存
img.save('icon-128.png')
print('图标已创建：icon-128.png')
EOF
```

### 或者使用 ImageMagick
```bash
cd browser-tool-extension/assets
convert -size 128x128 xc:'#007acc' \
  -fill white -draw "circle 64,64 64,32" \
  -fill white -draw "rectangle 60,20 68,108" \
  -fill white -draw "rectangle 20,60 108,68" \
  icon-128.png
```

### 最简单的方法
下载任意 PNG 图片并重命名为 `icon-128.png`，或者暂时跳过此步骤（扩展仍可正常工作，只是没有图标）。

## 第二步：安装扩展

### Chrome / Edge 浏览器

1. **打开扩展管理页面**
   - Chrome: 访问 `chrome://extensions/`
   - Edge: 访问 `edge://extensions/`
   - 或者：菜单 → 更多工具 → 扩展程序

2. **启用开发者模式**
   - 在页面右上角找到"开发者模式"开关
   - 打开开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"按钮
   - 选择 `browser-tool-extension` 文件夹
   - 点击"选择文件夹"

4. **完成**
   - 扩展图标会出现在浏览器工具栏
   - 点击图标即可使用

### Firefox 浏览器

1. **打开调试页面**
   - 访问 `about:debugging#/runtime/this-firefox`
   - 或者：菜单 → 更多工具 → 附加组件和主题 → 齿轮图标 → 调试附加组件

2. **加载临时附加组件**
   - 点击"临时加载附加组件"按钮
   - 导航到 `browser-tool-extension` 文件夹
   - 选择 `manifest.json` 文件
   - 点击"打开"

3. **完成**
   - 扩展图标会出现在浏览器工具栏
   - 点击图标即可使用

**注意**：Firefox 中临时加载的扩展在浏览器重启后会被移除，需要重新加载。

## 第三步：测试功能

### 测试 JSON 格式化
1. 切换到"JSON"标签
2. 粘贴以下测试数据：
```json
{"name":"测试","age":25,"skills":["JavaScript","Python"],"active":true}
```
3. 点击"格式化"按钮
4. 应该看到美化后的 JSON 和语法高亮

### 测试时间戳转换
1. 切换到"时间戳"标签
2. 点击"当前时间"按钮
3. 应该看到当前时间的各种格式

### 测试编码工具
1. 切换到"编码"标签
2. 输入"Hello 世界"
3. 选择"Base64"
4. 点击"编码"按钮
5. 应该看到编码结果

### 测试颜色取色器
1. 切换到"颜色"标签
2. 点击颜色预览块
3. 选择一个颜色
4. 应该看到 HEX、RGB、HSL 格式

## 常见问题

### Q: 扩展无法加载
A: 确保 `manifest.json` 文件格式正确，没有语法错误。

### Q: 图标不显示
A: 检查 `assets/icon-128.png` 文件是否存在。如果不存在，扩展仍可正常工作，只是没有图标。

### Q: 功能不工作
A: 打开浏览器开发者工具（F12），查看控制台是否有错误信息。

### Q: Firefox 重启后扩展消失
A: 这是正常的。临时加载的扩展不会永久保存。如需永久安装，需要签名扩展或使用开发者版 Firefox。

## 卸载扩展

### Chrome / Edge
1. 访问 `chrome://extensions/` 或 `edge://extensions/`
2. 找到"开发者工具箱"扩展
3. 点击"移除"按钮

### Firefox
1. 访问 `about:addons`
2. 找到"开发者工具箱"扩展
3. 点击"移除"按钮

## 下一步

- 自定义样式：编辑 `popup.css`
- 添加新功能：在 `utils/` 目录创建新模块
- 修改界面：编辑 `popup.html`
- 调整逻辑：编辑 `popup.js`

祝使用愉快！🎉
