const minLength = 4;
const maxLength = 128;
const characterSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~'
};

export const passwordGenerator = {
  minLength,
  maxLength,
  defaultLength: 16,
  generate(length, options = { uppercase: true, lowercase: true, digits: true, symbols: true }) {
    if (!Number.isInteger(length) || length < minLength || length > maxLength) {
      return { success: false, error: '密码长度需要是 ' + minLength + '–' + maxLength + ' 之间的整数。' };
    }
    const groups = Object.entries(characterSets).filter(([type]) => options[type]).map(([, characters]) => characters);
    if (!groups.length) return { success: false, error: '请至少选择一种字符类型。' };
    if (!globalThis.crypto?.getRandomValues) return { success: false, error: '当前环境无法使用安全随机源，请在支持的浏览器中打开扩展。' };
    const pool = groups.join('');
    const randomValues = new Uint32Array(128);
    const limit = Math.floor(2 ** 32 / pool.length) * pool.length;
    let cursor = randomValues.length;
    const randomCharacter = () => {
      let value;
      do {
        if (cursor === randomValues.length) {
          globalThis.crypto.getRandomValues(randomValues);
          cursor = 0;
        }
        value = randomValues[cursor++];
      } while (value >= limit);
      return pool[value % pool.length];
    };
    try {
      let characters;
      // 拒绝取模偏差及缺少所选类型的候选，保持有效密码的均匀分布。
      do {
        characters = Array.from({ length }, randomCharacter);
      } while (!groups.every(group => characters.some(character => group.includes(character))));
      return { success: true, result: characters.join('') };
    } catch {
      return { success: false, error: '安全随机源暂时不可用，请重新生成。' };
    }
  }
};
