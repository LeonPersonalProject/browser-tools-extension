// 模块入口与注入脚本共享同一份解析、搜索与渲染逻辑。
import './jsonCore.js';
export const jsonFormatter = globalThis.__candyJsonFormatter;
