// 进制转换工具

const converter = {
  // 支持的进制类型
  bases: {
    binary: 2,
    octal: 8,
    decimal: 10,
    hexadecimal: 16
  },

  // 验证输入是否为有效的指定进制数
  isValidNumber(value, base) {
    if (!value || typeof value !== 'string') return false;
    
    const trimmedValue = value.trim();
    if (trimmedValue === '') return false;
    
    // 移除进制前缀（如果有）
    let cleanValue = trimmedValue;
    if (base === 2 && cleanValue.startsWith('0b')) {
      cleanValue = cleanValue.slice(2);
    } else if (base === 8 && cleanValue.startsWith('0o')) {
      cleanValue = cleanValue.slice(2);
    } else if (base === 16 && (cleanValue.startsWith('0x') || cleanValue.startsWith('0X'))) {
      cleanValue = cleanValue.slice(2);
    }
    
    // 验证是否为有效的数字
    const regexMap = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^\d+$/,
      16: /^[0-9a-fA-F]+$/
    };
    
    return regexMap[base].test(cleanValue);
  },

  // 转换为十进制
  toDecimal(value, fromBase) {
    if (!this.isValidNumber(value, fromBase)) {
      return { success: false, error: `无效的${fromBase}进制数` };
    }
    
    const trimmedValue = value.trim();
    let cleanValue = trimmedValue;
    
    // 移除进制前缀
    if (fromBase === 2 && cleanValue.startsWith('0b')) {
      cleanValue = cleanValue.slice(2);
    } else if (fromBase === 8 && cleanValue.startsWith('0o')) {
      cleanValue = cleanValue.slice(2);
    } else if (fromBase === 16 && (cleanValue.startsWith('0x') || cleanValue.startsWith('0X'))) {
      cleanValue = cleanValue.slice(2);
    }
    
    try {
      const decimal = parseInt(cleanValue, fromBase);
      return { success: true, result: decimal };
    } catch (error) {
      return { success: false, error: '转换失败' };
    }
  },

  // 从十进制转换到其他进制
  fromDecimal(decimal, toBase) {
    if (typeof decimal !== 'number' || isNaN(decimal) || decimal < 0) {
      return { success: false, error: '无效的十进制数' };
    }
    
    try {
      let result = decimal.toString(toBase);
      if (toBase === 16) {
        result = result.toUpperCase();
      }
      return { success: true, result };
    } catch (error) {
      return { success: false, error: '转换失败' };
    }
  },

  // 执行进制转换
  convert(value, fromBase, toBase) {
    // 转换为十进制
    const decimalResult = this.toDecimal(value, fromBase);
    if (!decimalResult.success) {
      return decimalResult;
    }
    
    // 从十进制转换到目标进制
    return this.fromDecimal(decimalResult.result, toBase);
  },

  // 转换为所有支持的进制
  convertToAll(value, fromBase) {
    // 转换为十进制
    const decimalResult = this.toDecimal(value, fromBase);
    if (!decimalResult.success) {
      return decimalResult;
    }
    
    const decimal = decimalResult.result;
    const results = {
      decimal: decimal.toString(),
      binary: this.fromDecimal(decimal, 2).result,
      octal: this.fromDecimal(decimal, 8).result,
      hexadecimal: this.fromDecimal(decimal, 16).result
    };
    
    return { success: true, results };
  }
};

export { converter };
