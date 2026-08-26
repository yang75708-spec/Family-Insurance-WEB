// Excel 金融函数引擎（与小程序 utils/excel.js 严格一致，匹配 Excel 的 PV/FV/PMT/SWITCH/MATCH/CHOOSE）

const Excel = {
  SWITCH(value, pairs, def) {
    for (let i = 0; i < pairs.length; i += 2) {
      if (value === pairs[i]) return pairs[i + 1];
    }
    return def !== undefined ? def : 0;
  },

  MATCH(value, lookupArray) {
    const idx = lookupArray.indexOf(value);
    return idx >= 0 ? idx + 1 : lookupArray.length;
  },

  CHOOSE(index, ...args) {
    const n = Math.floor(index);
    if (n >= 1 && n <= args.length) return args[n - 1];
    return 0;
  },

  // Excel PV(rate, nper, pmt, [fv], [type])
  PV(rate, nper, pmt, fv = 0, type = 0) {
    if (rate === 0) return -(pmt * nper + fv);
    const pvifa = (1 + rate * type) * ((1 - 1 / Math.pow(1 + rate, nper)) / rate);
    return -(pmt * pvifa + fv / Math.pow(1 + rate, nper));
  },

  // Excel FV(rate, nper, pmt, [pv], [type])
  FV(rate, nper, pmt, pv = 0, type = 0) {
    if (rate === 0) return -(pv + pmt * nper);
    const fvifa = (1 + rate * type) * (Math.pow(1 + rate, nper) - 1) / rate;
    return -(pv * Math.pow(1 + rate, nper) + pmt * fvifa);
  },

  // Excel PMT(rate, nper, pv, [fv], [type])
  PMT(rate, nper, pv, fv = 0, type = 0) {
    if (rate === 0) return -(pv + fv) / nper;
    const pvifa = (1 + rate * type) * (Math.pow(1 + rate, nper) - 1) / rate;
    return -(pv * Math.pow(1 + rate, nper) + fv) / pvifa;
  },
};

// 流动资产 = 存款 + 理财（万元）
function getLiquidAsset(depositVal, investmentVal) {
  return depositVal + investmentVal;
}

export { Excel, getLiquidAsset };
