const inRange = (value, max) => Number.isFinite(value) && value >= 0 && value <= max;
const channel = text => text.endsWith('%') ? Number(text.slice(0, -1)) * 255 / 100 : Number(text);
const alpha = text => text === undefined ? 1 : text.endsWith('%') ? Number(text.slice(0, -1)) / 100 : Number(text);
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h * 12) % 12; return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255; };
  return [f(0), f(8), f(4)];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (delta) h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [((h * 60) + 360) % 360, delta ? delta / (1 - Math.abs(2 * l - 1)) * 100 : 0, l * 100];
}
const decimal = value => String(Math.round(value * 1000) / 1000);
export const colorPicker = {
  parse(text) {
    text = text.trim().toLowerCase();
    let channels, a = 1;
    if (/^#?[\da-f]{3,8}$/.test(text)) {
      let hex = text.replace('#', '');
      if (![3, 4, 6, 8].includes(hex.length)) throw new Error('HEX 需要 3、4、6 或 8 位。');
      if (hex.length <= 4) hex = [...hex].map(ch => ch + ch).join('');
      channels = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
      if (hex.length === 8) a = parseInt(hex.slice(6), 16) / 255;
    } else {
      const match = text.match(/^(rgba?|hsla?)\((.*)\)$/);
      if (!match) throw new Error('请输入 HEX、RGB(A) 或 HSL(A) 颜色。');
      const body = match[2].trim();
      const comma = body.includes(',');
      if (comma && body.includes('/')) throw new Error('不能混用逗号和斜线分隔。');
      const parts = comma ? body.split(',').map(part => part.trim()) : body.replace(/\s*\/\s*/, ' / ').split(/\s+/);
      if (!comma && parts.includes('/')) {
        if (parts.length !== 5 || parts[3] !== '/') throw new Error('不透明度前需要一个斜线。');
        parts.splice(3, 1);
      } else if (!comma && parts.length !== 3) throw new Error('空格语法的不透明度需要斜线。');
      if (parts.length < 3 || parts.length > 4 || parts.some(part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:%|deg|rad|turn)?$/.test(part))) throw new Error('颜色格式无效，请检查通道数值。');
      if (parts[3] && !/^[\d.]+%?$/.test(parts[3])) throw new Error('不透明度应为 0–1 或百分比。');
      a = alpha(parts[3]);
      if (match[1].startsWith('rgb')) {
        if (parts.slice(0, 3).some(part => !/^[+-]?[\d.]+%?$/.test(part))) throw new Error('RGB 通道应为数字或百分比。');
        channels = parts.slice(0, 3).map(channel);
      } else {
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%$/.test(parts[1]) || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%$/.test(parts[2])) throw new Error('HSL 的饱和度和亮度需要百分比。');
        const saturation = parseFloat(parts[1]), lightness = parseFloat(parts[2]);
        let hue = parseFloat(parts[0]);
        if (parts[0].endsWith('%')) throw new Error('色相不能使用百分比。');
        if (parts[0].endsWith('turn')) hue *= 360;
        if (parts[0].endsWith('rad')) hue *= 180 / Math.PI;
        if (!inRange(saturation, 100) || !inRange(lightness, 100)) throw new Error('饱和度和亮度应在 0%–100% 之间。');
        channels = hslToRgb(hue, saturation, lightness);
      }
    }
    if (!channels.every(value => inRange(value, 255)) || !inRange(a, 1)) throw new Error('RGB 应在 0–255 之间，不透明度应在 0–1 之间。');
    return { r: channels[0], g: channels[1], b: channels[2], a };
  },
  formats(color) {
    const { r, g, b, a } = color;
    const hex = '#' + [r, g, b, ...(a < 1 ? [a * 255] : [])].map(value => Math.round(value).toString(16).padStart(2, '0')).join('').toUpperCase();
    const rgb = (a < 1 ? 'rgba(' : 'rgb(') + [r, g, b].map(Math.round).join(', ') + (a < 1 ? ', ' + decimal(a) : '') + ')';
    const [h, s, l] = rgbToHsl(r, g, b);
    const hsl = (a < 1 ? 'hsla(' : 'hsl(') + Math.round(h) + ', ' + decimal(s) + '%, ' + decimal(l) + '%' + (a < 1 ? ', ' + decimal(a) : '') + ')';
    return { hex, rgb, hsl };
  },
  composite(foreground, background) {
    return Object.fromEntries(['r', 'g', 'b'].map(key => [key, foreground[key] * foreground.a + background[key] * (1 - foreground.a)]).concat([['a', 1]]));
  },
  contrast(foreground, background) {
    const bg = this.composite(background, { r: 255, g: 255, b: 255, a: 1 });
    const fg = this.composite(foreground, bg);
    const luminance = color => ['r', 'g', 'b'].map(key => color[key] / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const f = luminance(fg), b = luminance(bg);
    return { ratio: (Math.max(f, b) + .05) / (Math.min(f, b) + .05), foreground: fg, background: bg };
  }
};
