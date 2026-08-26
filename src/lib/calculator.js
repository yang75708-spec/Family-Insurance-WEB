// 公式引擎（与小程序 utils/calculator.js 严格一致，逻辑完全对应）
// 参数决策：Kjob=总参数docx(0.95/0.90/0.80/0.60)；α=自选(0.3/0.5/0.6)；重疾险费率=缴费期均衡费率(保至70岁)

import { Excel } from './excel.js';
import RATES from './rates.js';
import { MID, resolve, getMedicalMid } from './options.js';

// ====== 固定参数 ======
const G = 0.025;                 // 寿险/养老金通胀率
const R_LIFE = 0.035;            // 寿险折现率
const R_PENSION = 0.03;          // 养老金折现率/年投入收益率
const RETIRE_AGE = 63;           // 法定退休年龄
const SUPPORT_YEARS = 20;        // 赡养年限
const REPLACEMENT = 0.583;       // 养老金替代率
const HEALTH_R = 0.025;          // 健康险折现率 r（公共通胀 2.5%）
const PV_YEARS = 5;              // 健康险 PV 年限（5年）

// Kjob 职业稳定系数（总参数docx）——健康险收入法PV使用
const KJOB = {
  '非常稳定（例如：公务员/国企/事业单位）': 0.95,
  '较稳定（例如：大型企业核心岗）': 0.90,
  '一般（例如：中小企/绩效占比高）': 0.80,
  '不稳定（例如：自由职业/创业/销售）': 0.60,
};

// 寿险职业风险系数（网页 CAREER_RISK_MAP）：职业越不稳定，收入损失上浮越多
const CAREER_RISK_MAP = {
  '非常稳定（例如：公务员/国企/事业单位）': 0.8,
  '较稳定（例如：大型企业核心岗）': 1.0,
  '一般（例如：中小企/绩效占比高）': 1.2,
  '不稳定（例如：自由职业/创业/销售）': 1.5,
};

// 健康系数（总参数docx）：优0.8/良1.0/差1.5/吸烟1.8
const HEALTH_COEFF = { '优': 0.8, '良': 1.0, '差': 1.5, '吸烟': 1.8 };

// 是否吸烟 → 系数（吸烟档直接取 1.8，否则按健康状态）
function getHealthCoeff(health, smoke) {
  if (smoke) return HEALTH_COEFF['吸烟'];
  return HEALTH_COEFF[health] || 1.0;
}

// 家庭系数 α
const FAMILY_COEFF = { '保守': 0.3, '稳健': 0.5, '进取': 0.6 };

// ====== 城市分组 / 重症基础花销 ======
function getCityGroup(city) {
  if (city === '北上广深') return '一线';
  if (city === '新一线/二线') return '新一线/二线';
  if (city === '普通地级市') return '普通地级市';
  return '县城';
}
function getSevereCost(city) {
  const g = getCityGroup(city);
  return (g === '一线' || g === '新一线/二线') ? 50 : 30;
}

// 期望医疗年花销（万元）= 所选区间中值。区间表与函数定义在 options.js（36组：4城市×3健康×A/B/C）
// 重症基础花销由 getSevereCost 计入重疾缺口（一线/新一线/二线 50万，其余 30万）
function getExpectedMedicalCost(city, health, bracket) {
  return getMedicalMid(city, health, bracket);
}

// ====== 重疾险费率：缴费期均衡费率（保至70岁） ======
function getCIBand(age) {
  if (age < 20) return '20-25';
  if (age > 65) return '61-65';
  for (const b of RATES.CI_BANDS) {
    const parts = b.split('-');
    const lo = parseInt(parts[0], 10), hi = parseInt(parts[1], 10);
    if (age >= lo && age <= hi) return b;
  }
  return '61-65';
}
function getCIRate(age, gender, period) {
  const key = gender === '女性' ? 'f' : 'm';
  const col = { '趸缴': 'd', '10年': 'p10', '20年': 'p20', '30年': 'p30' }[period] || 'p20';
  const row = RATES.CI_PAY[getCIBand(age)];
  return row[col][key];
}

// ====== 寿险费率 ======
function getLifeRate(age, gender) {
  for (const [min, max, male, female] of RATES.LIFE_RATES) {
    if (age >= min && age < max) return gender === '女性' ? female : male;
  }
  return 0.009;
}
function getSalaryGrowthForLife(age) {
  if (age < 30) return 0.045;
  if (age < 40) return 0.04;
  if (age < 50) return 0.02;
  return 0.005;
}
function getExistingLifeYears(val) {
  switch (val) {
    case '10年以下': return 5;
    case '10-20年': return 15;
    case '20年以上': return 25;
    default: return 0;
  }
}
function getIncomeRatio(i1, i2, isFirst) {
  const total = i1 + i2;
  if (total === 0) return 0.5;
  return isFirst ? i1 / total : i2 / total;
}

// 增长年金现值：C × (1+g)/(r-g) × [1-((1+g)/(1+r))^n]
function growingAnnuityPV(C, g, r, n) {
  if (n <= 0) return 0;
  if (Math.abs(r - g) < 1e-9) return C * n / (1 + r);
  return C * (1 + g) / (r - g) * (1 - Math.pow((1 + g) / (1 + r), n));
}

// ====== 医疗险推荐层级 ======
const MI_TIERS = [
  { id: '社保医保', coverage: 8, premium: 0, maxAge: 99 },
  { id: '惠民保', coverage: 15, premium: 0.008, maxAge: 99 },
  { id: '百万医疗', coverage: 80, premium: 0.05, maxAge: 60 },
  { id: '中端医疗', coverage: 150, minIncome: 15, premium: 0.4, maxAge: 65 },
  { id: '高端医疗', coverage: 300, minIncome: 45, premium: 2, maxAge: 70 },
];
function getCurrentTierIdx(hasSocial, hasHuimin, hasBaiwan, hasZhongduan, hasGaoduan) {
  if (hasGaoduan) return 4;
  if (hasZhongduan) return 3;
  if (hasBaiwan) return 2;
  if (hasHuimin) return 1;
  return 0;
}
function getEffectiveCoverage(hasSocial, hasHuimin, hasBaiwan, hasZhongduan, hasGaoduan) {
  let c = 0;
  if (hasGaoduan) c = Math.max(c, 300);
  if (hasZhongduan) c = Math.max(c, 150);
  if (hasBaiwan) c = Math.max(c, 80);
  if (hasHuimin) c = Math.max(c, 15);
  if (hasSocial) c = Math.max(c, 8);
  return c;
}
function recommendMIPlan(hasSocial, hasHuimin, hasBaiwan, hasZhongduan, hasGaoduan, medicalCost, miGap, budget, householdIncome, age, isParent) {
  const currentIdx = getCurrentTierIdx(hasSocial, hasHuimin, hasBaiwan, hasZhongduan, hasGaoduan);
  const fmt = (n) => String(Math.round(n * 1000) / 1000).replace(/\.?0+$/, '');
  if (miGap <= 0 && (hasBaiwan || hasZhongduan || hasGaoduan)) {
    return { type: '已配置完善', reason: '已有商业医疗险，保障已覆盖当前医疗缺口' };
  }
  if (!hasBaiwan && !hasZhongduan && !hasGaoduan) {
    const canBaiwan = age <= 60;
    if (isParent) {
      return canBaiwan
        ? { type: '百万医疗', reason: '建议为父母配置百万医疗（保额80万），健康问题无法投保可考虑防癌医疗险或惠民保' }
        : { type: '惠民保', reason: '父母年龄已超百万医疗投保上限，建议惠民保作基础保障' };
    }
    if (!canBaiwan) return { type: '惠民保', reason: '年龄已超百万医疗投保上限，建议惠民保，年保费约0.008万' };
    return { type: '百万医疗', reason: '建议配置百万医疗作为基础保障，年保费约0.05万' };
  }
  let minSufficientIdx = -1;
  for (let i = currentIdx + 1; i < MI_TIERS.length; i++) {
    if (age > MI_TIERS[i].maxAge) continue;
    if (MI_TIERS[i].coverage >= medicalCost) { minSufficientIdx = i; break; }
  }
  if (minSufficientIdx === -1) {
    for (let i = currentIdx + 1; i < MI_TIERS.length; i++) {
      if (age <= MI_TIERS[i].maxAge) minSufficientIdx = i;
    }
  }
  const recIdx = Math.max(minSufficientIdx, currentIdx + 1);
  const recTier = MI_TIERS[recIdx];
  const minIncomeRequired = recTier.minIncome || 0;
  const incomeQualified = householdIncome >= minIncomeRequired;
  if (incomeQualified) {
    const upgradeIdx = recIdx + 1;
    if (upgradeIdx < MI_TIERS.length && age <= MI_TIERS[upgradeIdx].maxAge && budget >= MI_TIERS[upgradeIdx].premium) {
      const upgradeTier = MI_TIERS[upgradeIdx];
      return { type: recTier.id, reason: `${recTier.id}（${recTier.coverage}万）已能覆盖缺口，预算充足可升级至${upgradeTier.id}（年保费约${fmt(upgradeTier.premium)}万）` };
    }
    return { type: recTier.id, reason: `推荐${recTier.id}（保额${recTier.coverage}万），年保费约${fmt(recTier.premium)}万` };
  }
  if (budget >= recTier.premium) {
    return { type: recTier.id, reason: `推荐${recTier.id}（保额${recTier.coverage}万），年保费约${fmt(recTier.premium)}万` };
  }
  let bestIdx = currentIdx;
  for (let i = currentIdx + 1; i < MI_TIERS.length; i++) {
    if (age > MI_TIERS[i].maxAge) continue;
    if (budget >= MI_TIERS[i].premium) bestIdx = i;
    else break;
  }
  if (bestIdx <= currentIdx) {
    return { type: MI_TIERS[currentIdx].id, reason: `预算${fmt(budget)}万内暂无更高方案，维持${MI_TIERS[currentIdx].id}` };
  }
  const bestTier = MI_TIERS[bestIdx];
  return { type: bestTier.id, reason: `预算${fmt(budget)}万，建议${bestTier.id}（保额${bestTier.coverage}万）` };
}
function estimateMIPremium(age, income, recType) {
  const ageFactor = age < 30 ? 1 : age < 40 ? 1.2 : age < 50 ? 1.6 : age < 60 ? 2.5 : 4;
  const incomeFactor = income < 22.5 ? 1 : income < 80 ? 1.1 : income < 200 ? 1.3 : 1.6;
  let base;
  if (recType.includes('高端医疗')) base = 1.5;
  else if (recType.includes('中端医疗')) base = 0.4;
  else if (recType.includes('百万医疗')) base = 0.05;
  else base = 0.03;
  return Math.round(base * ageFactor * incomeFactor * 100) / 100;
}
function computeChildCIRecommendation(childAge, city, income1, income2) {
  const cityBase = city === '北上广深' ? 65 : city === '新一线/二线' ? 50 : city === '普通地级市' ? 40 : 35;
  const familyAvg = (income1 + income2) / 2;
  const incomeFactor = Math.max(0.7, Math.min(2, familyAvg / 45));
  const ageFactor = childAge <= 1 ? 1.2 : childAge <= 6 ? 1.0 : childAge <= 12 ? 0.9 : 0.8;
  return Math.max(20, Math.min(100, Math.round(cityBase * incomeFactor * ageFactor)));
}

const round2 = (x) => Math.round(x * 100) / 100;

// ====== 主计算 ======
function calculate(input) {
  const d = input;
  const r = {};

  // ── 衍生计算 ──
  const firstRemainingYears = Math.max(0, RETIRE_AGE - d.firstPersonAge);
  const secondRemainingWorkYears = Math.max(0, RETIRE_AGE - d.secondPersonAge);
  const childToGradYears = Math.max(0, 22 - d.childAge);
  const firstProtectYears = Math.min(firstRemainingYears, childToGradYears);
  const secondProtectYears = Math.min(secondRemainingWorkYears, childToGradYears);

  const income1 = resolve(MID.income, d.firstPersonIncome, 22.5);
  const income2 = resolve(MID.income, d.secondPersonIncome, 7.5);
  const householdIncome = income1 + income2;
  const ratio1 = getIncomeRatio(income1, income2, true);
  const ratio2 = 1 - ratio1;
  const expenseVal = resolve(MID.expenseVal, d.annualExpense, 15);
  const depositVal = resolve(MID.deposit, d.bankDeposit, 12.5);
  const investVal = resolve(MID.investment, d.lowRiskInvestment, 2.5);
  const liquidAsset = depositVal + investVal;

  const kjob1 = KJOB[d.incomeStability] || 0.9;
  const kjob2 = KJOB[d.incomeStability2] || 0.9;

  // ══════════ 健康险 ══════════
  // g = 各支柱年龄对应的工资增长系数（4.5/4/2/0.5%）；r = 2.5%（公共通胀）
  const salaryGrowthH1 = getSalaryGrowthForLife(d.firstPersonAge);
  const salaryGrowthH2 = getSalaryGrowthForLife(d.secondPersonAge);
  const pvFactor5 = (g) => (1 - Math.pow((1 + g) / (1 + HEALTH_R), PV_YEARS)) / (HEALTH_R - g);

  // 收入法 PV（5年）：income × PV系数 × Kjob
  const pvIncome1 = income1 * pvFactor5(salaryGrowthH1) * kjob1;
  const pvIncome2 = income2 * pvFactor5(salaryGrowthH2) * kjob2;

  // 需求法 PV（5年）：债务覆盖 + 子女教育金 + 家庭生活支出，按收入占比分摊；支出增长率同用工资增长系数
  const householdDebt = resolve(MID.mortgage, d.mortgageBalance, 0) + resolve(MID.otherLoan, d.otherLoanAmount, 0);
  const eduYears = Math.min(PV_YEARS, Math.max(0, childToGradYears));
  const needBase1 = householdDebt + d.childCount * 3 * eduYears + expenseVal * pvFactor5(salaryGrowthH1);
  const needBase2 = householdDebt + d.childCount * 3 * eduYears + expenseVal * pvFactor5(salaryGrowthH2);
  const needPV1 = needBase1 * ratio1;
  const needPV2 = needBase2 * ratio2;

  const severeCost = getSevereCost(d.city);
  const existingCIEff1 = Math.max(Number(d.firstPersonCIExisting) || 0, d.p1_重疾险 ? 30 : 0);
  const existingCIEff2 = Math.max(Number(d.secondPersonCIExisting) || 0, d.p2_重疾险 ? 30 : 0);

  const recCI1 = round2((pvIncome1 + needPV1) / 2 + severeCost);
  const ciGap1 = Math.max(0, round2(recCI1 - existingCIEff1));
  const recCI2 = round2((pvIncome2 + needPV2) / 2 + severeCost);
  const ciGap2 = Math.max(0, round2(recCI2 - existingCIEff2));

  const expectedMedical1 = getExpectedMedicalCost(d.city, d.firstPersonHealthStatus, d.p1_期望医疗消费档位);
  const expectedMedical2 = getExpectedMedicalCost(d.city, d.secondPersonHealthStatus, d.p2_期望医疗消费档位);
  const effCov1 = getEffectiveCoverage(d.p1_社保医保, d.p1_惠民保, d.p1_百万医疗, d.p1_中端医疗, d.p1_高端医疗);
  const effCov2 = getEffectiveCoverage(d.p2_社保医保, d.p2_惠民保, d.p2_百万医疗, d.p2_中端医疗, d.p2_高端医疗);
  const miCoverage1 = Math.max(Number(d.firstPersonMIExisting) || 0, effCov1);
  const miCoverage2 = Math.max(Number(d.secondPersonMIExisting) || 0, effCov2);
  const miGap1 = Math.max(0, round2(expectedMedical1 - miCoverage1));
  const miGap2 = Math.max(0, round2(expectedMedical2 - miCoverage2));

  const alpha = FAMILY_COEFF[d.familyCoefficient] || 0.5;
  const ciHealth1 = getHealthCoeff(d.firstPersonHealthStatus, d.firstPersonSmoke);
  const ciHealth2 = getHealthCoeff(d.secondPersonHealthStatus, d.secondPersonSmoke);
  const ciRate1 = getCIRate(d.firstPersonAge, d.firstPersonGender, d.ciPayPeriod);
  const ciRate2 = getCIRate(d.secondPersonAge, d.secondPersonGender, d.ciPayPeriod);
  const isDun = d.ciPayPeriod === '趸缴';

  const totalHealthGap1 = round2(ciGap1 + miGap1);
  const totalHealthGap2 = round2(ciGap2 + miGap2);

  // 医疗险推荐
  const { type: recMIType1, reason: miReason1 } = recommendMIPlan(
    d.p1_社保医保, d.p1_惠民保, d.p1_百万医疗, d.p1_中端医疗, d.p1_高端医疗,
    expectedMedical1, miGap1, resolve(MID.miBudget, d.firstPersonMIPremiumBudget, 0), householdIncome, d.firstPersonAge, false);
  const { type: recMIType2, reason: miReason2 } = recommendMIPlan(
    d.p2_社保医保, d.p2_惠民保, d.p2_百万医疗, d.p2_中端医疗, d.p2_高端医疗,
    expectedMedical2, miGap2, resolve(MID.miBudget, d.secondPersonMIPremiumBudget, 0), householdIncome, d.secondPersonAge, false);

  const estCIPrem1 = round2(ciGap1 * ciRate1 * ciHealth1);
  const estCIPrem2 = round2(ciGap2 * ciRate2 * ciHealth2);
  const estMIPrem1 = estimateMIPremium(d.firstPersonAge, income1, recMIType1);
  const estMIPrem2 = estimateMIPremium(d.secondPersonAge, income2, recMIType2);
  const totalHealthPrem1 = round2(estCIPrem1 + estMIPrem1);
  const totalHealthPrem2 = round2(estCIPrem2 + estMIPrem2);
  const ciBudget1 = resolve(MID.ciBudget, d.firstPersonCIPremiumBudget, 2);
  const ciBudget2 = resolve(MID.ciBudget, d.secondPersonCIPremiumBudget, 2);
  const miBudget1 = resolve(MID.miBudget, d.firstPersonMIPremiumBudget, 2);
  const miBudget2 = resolve(MID.miBudget, d.secondPersonMIPremiumBudget, 2);
  const healthBudget1 = totalHealthPrem1 <= (ciBudget1 + miBudget1) ? '✅预算充足' : '⚠️预算不足';
  const healthBudget2 = totalHealthPrem2 <= (ciBudget2 + miBudget2) ? '✅预算充足' : '⚠️预算不足';

  // ══════════ 寿险（主文档公式：g=2.5%, r=3.5%） ══════════
  const mortgageVal = resolve(MID.mortgage, d.mortgageBalance, 0);
  const otherLoanVal = resolve(MID.otherLoan, d.otherLoanAmount, 0);
  const existingLife1 = d.firstPersonHasLifeIns ? resolve(MID.lifeCoverage, d.firstPersonLifeCoverage, 0) : 0;
  const existingLife2 = d.secondPersonHasLifeIns ? resolve(MID.lifeCoverage, d.secondPersonLifeCoverage, 0) : 0;
  const existLifeYears1 = d.firstPersonHasLifeIns ? getExistingLifeYears(d.firstPersonExistingLifeYears) : 0;
  const existLifeYears2 = d.secondPersonHasLifeIns ? getExistingLifeYears(d.secondPersonExistingLifeYears) : 0;
  const salaryGrowth1 = getSalaryGrowthForLife(d.firstPersonAge);
  const salaryGrowth2 = getSalaryGrowthForLife(d.secondPersonAge);
  const careerRisk1 = CAREER_RISK_MAP[d.incomeStability] || 1.0;
  const careerRisk2 = CAREER_RISK_MAP[d.incomeStability2] || 1.0;

  // 支出缺口
  const lifeExpenseGap1 = Math.max(0,
    mortgageVal * ratio1 + otherLoanVal * ratio1
    + growingAnnuityPV(expenseVal, G, R_LIFE, firstProtectYears) * ratio1
    + d.childCount * 30 * growingAnnuityPV(1, G, R_LIFE, childToGradYears) * ratio1
    + d.parentSupportCount * 20 * growingAnnuityPV(1, G, R_LIFE, SUPPORT_YEARS) * ratio1
    - (depositVal + investVal)
    - existingLife1 * Math.min(existLifeYears1, firstProtectYears) / Math.max(firstProtectYears, 1));
  // 收入损失
  const lifeIncomeGap1 = Math.max(0,
    growingAnnuityPV(income1, salaryGrowth1, R_LIFE, firstRemainingYears) * careerRisk1
    - existingLife1 * Math.min(existLifeYears1, firstRemainingYears) / Math.max(firstRemainingYears, 1));

  const lifeExpenseGap2 = Math.max(0,
    mortgageVal * ratio2 + otherLoanVal * ratio2
    + growingAnnuityPV(expenseVal, G, R_LIFE, secondProtectYears) * ratio2
    + d.childCount * 30 * growingAnnuityPV(1, G, R_LIFE, childToGradYears) * ratio2
    + d.parentSupportCount * 20 * growingAnnuityPV(1, G, R_LIFE, SUPPORT_YEARS) * ratio2
    - (depositVal + investVal)
    - existingLife2 * Math.min(existLifeYears2, secondProtectYears) / Math.max(secondProtectYears, 1));
  const lifeIncomeGap2 = Math.max(0,
    growingAnnuityPV(income2, salaryGrowth2, R_LIFE, secondRemainingWorkYears) * careerRisk2
    - existingLife2 * Math.min(existLifeYears2, secondRemainingWorkYears) / Math.max(secondRemainingWorkYears, 1));

  const recLife1 = round2(Math.max(lifeExpenseGap1, lifeIncomeGap1));
  const recLife2 = round2(Math.max(lifeExpenseGap2, lifeIncomeGap2));
  const lifeGap1 = Math.max(0, round2(recLife1 - existingLife1));
  const lifeGap2 = Math.max(0, round2(recLife2 - existingLife2));
  const lifeRate1 = getLifeRate(d.firstPersonAge, d.firstPersonGender);
  const lifeRate2 = getLifeRate(d.secondPersonAge, d.secondPersonGender);
  const lifeHealth1 = getHealthCoeff(d.firstPersonHealthStatus, d.firstPersonSmoke);
  const lifeHealth2 = getHealthCoeff(d.secondPersonHealthStatus, d.secondPersonSmoke);
  const estLifePrem1 = round2(lifeRate1 * Math.max(0, recLife1 - existingLife1) * lifeHealth1);
  const estLifePrem2 = round2(lifeRate2 * Math.max(0, recLife2 - existingLife2) * lifeHealth2);
  const lifeBudget1 = estLifePrem1 <= (Number(d.firstPersonLifeBudget) || 0) ? '✅预算充足' : '⚠️预算不足，建议降低保额或调整期限';
  const lifeBudget2 = estLifePrem2 <= (Number(d.secondPersonLifeBudget) || 0) ? '✅预算充足' : '⚠️预算不足，建议降低保额或调整期限';
  const lifeTerm1 = d.firstPersonLifeTerm === '63岁' ? '推荐定期寿险至63岁' : d.firstPersonLifeTerm === '65岁' ? '推荐定期寿险至65岁' : d.firstPersonLifeTerm === '终身' ? '推荐终身寿险' : '推荐定期寿险至房贷还清或子女成年';
  const lifeTerm2 = d.secondPersonLifeTerm === '63岁' ? '推荐定期寿险至63岁' : d.secondPersonLifeTerm === '65岁' ? '推荐定期寿险至65岁' : d.secondPersonLifeTerm === '终身' ? '推荐终身寿险' : '推荐定期寿险至房贷还清或子女成年';

  // ══════════ 养老金（主文档公式） ══════════
  const pensionDiscount = R_PENSION;
  const payYears1 = resolve(MID.payYears, d.firstPersonPayYears, 20);
  const payYears2 = resolve(MID.payYears, d.secondPersonPayYears, 20);
  const remainingN1 = resolve(MID.retireAge, d.firstPersonRetireAge, 62) - d.firstPersonAge;
  const remainingN2 = resolve(MID.retireAge, d.secondPersonRetireAge, 62) - d.secondPersonAge;
  const retireYears1 = resolve(MID.retireYears, d.firstPersonRetireYears, 25);
  const retireYears2 = resolve(MID.retireYears, d.secondPersonRetireYears, 25);

  // 退休生活目标（实际）= MIN(填写×1.03^n, 58.3%×当前收入×1.03^n)
  const goal1 = resolve(MID.retireGoal, d.firstPersonRetireGoal, 15);
  const goal2 = resolve(MID.retireGoal, d.secondPersonRetireGoal, 8);
  const goalActual1 = Math.min(goal1 * Math.pow(1 + pensionDiscount, Math.max(0, remainingN1)), REPLACEMENT * income1 * Math.pow(1 + pensionDiscount, Math.max(0, remainingN1)));
  const goalActual2 = Math.min(goal2 * Math.pow(1 + pensionDiscount, Math.max(0, remainingN2)), REPLACEMENT * income2 * Math.pow(1 + pensionDiscount, Math.max(0, remainingN2)));

  const retireNeedPV1 = Excel.PV(pensionDiscount, retireYears1, -goalActual1, 0, 1);
  const retireNeedPV2 = Excel.PV(pensionDiscount, retireYears2, -goalActual2, 0, 1);

  const fund1 = resolve(MID.pensionFund, d.firstPersonPensionFund, 2);
  const com1 = resolve(MID.pensionFund, d.firstPersonComPension, 2);
  const personal1 = resolve(MID.pensionFund, d.firstPersonPersonalPension, 2);
  const social1 = resolve(MID.socialPension, d.firstPersonSocialPension, 0.35);
  const fund2 = resolve(MID.pensionFund, d.secondPersonPensionFund, 2);
  const com2 = resolve(MID.pensionFund, d.secondPersonComPension, 2);
  const personal2 = resolve(MID.pensionFund, d.secondPersonPersonalPension, 2);
  const social2 = resolve(MID.socialPension, d.secondPersonSocialPension, 0.35);

  const existingReserveFV1 =
    Excel.FV(0.0256, Math.max(0, remainingN1), 0, -fund1, 0)
    + Excel.FV(0.025, Math.max(0, remainingN1), 0, -com1, 0)
    + Excel.FV(0.0465, Math.max(0, remainingN1), 0, -personal1, 0)
    + Excel.PV(pensionDiscount, retireYears1, -(social1 * 12), 0, 1);
  const existingReserveFV2 =
    Excel.FV(0.0256, Math.max(0, remainingN2), 0, -fund2, 0)
    + Excel.FV(0.025, Math.max(0, remainingN2), 0, -com2, 0)
    + Excel.FV(0.0465, Math.max(0, remainingN2), 0, -personal2, 0)
    + Excel.PV(pensionDiscount, retireYears2, -(social2 * 12), 0, 1);

  const retireGap1 = Math.max(0, retireNeedPV1 - existingReserveFV1);
  const retireGap2 = Math.max(0, retireNeedPV2 - existingReserveFV2);
  const recPension1 = payYears1 > 0 ? Math.max(0, round2(-Excel.PMT(pensionDiscount, payYears1, 0, retireGap1, 1))) : 0;
  const recPension2 = payYears2 > 0 ? Math.max(0, round2(-Excel.PMT(pensionDiscount, payYears2, 0, retireGap2, 1))) : 0;
  const pensionBudget1v = resolve(MID.pensionBudget, d.firstPersonPensionBudget, 2);
  const pensionBudget2v = resolve(MID.pensionBudget, d.secondPersonPensionBudget, 2);
  const pensionBudget1 = recPension1 <= pensionBudget1v ? '✅预算充足' : '⚠️预算不足，请调整比例或延长缴费期';
  const pensionBudget2 = recPension2 <= pensionBudget2v ? '✅预算充足' : '⚠️预算不足，请调整比例或延长缴费期';

  // ══════════ 子女 / 父母 ══════════
  const childCIRec = computeChildCIRecommendation(d.childAge, d.city, income1, income2);
  const childCIGap = Math.max(0, childCIRec - (Number(d.childCIExisting) || 0));
  const childMedicalCost = (d.city === '北上广深' ? 80 : d.city === '新一线/二线' ? 50 : 30);
  const { type: childMIType, reason: childMIReason } = recommendMIPlan(
    d.child_社保医保, d.child_惠民保, d.child_百万医疗, d.child_中端医疗, d.child_高端医疗,
    childMedicalCost, 0, resolve(MID.miBudget, d.childMIPremiumBudget, 0), householdIncome, d.childAge, false);
  const childLifeRec = (d.childParentLifeIns === '仅子女' || d.childParentLifeIns === '都需要') ? 20 : 0;
  const childLifeConclusion = d.childParentLifeIns === '都不需要' ? '不推荐（无收入，寿险非必需）'
    : d.childParentLifeIns === '仅子女' ? '可配置少量（建议≤20万），但非必需，优先保障经济支柱'
    : d.childParentLifeIns === '仅父母' ? '不推荐，子女无需寿险'
    : d.childParentLifeIns === '都需要' ? '子女可配置少量（建议≤20万），但非必需' : '请选择配置意愿';

  const parentMedicalCost = childMedicalCost * 1.5;
  const { type: parentMIType, reason: parentMIReason } = recommendMIPlan(
    d.parent_社保医保, d.parent_惠民保, d.parent_百万医疗, d.parent_中端医疗, d.parent_高端医疗,
    parentMedicalCost, 0, resolve(MID.miBudget, d.parentMIPremiumBudget, 0), householdIncome, 55, true);
  const parentLifeConclusion = d.childParentLifeIns === '都不需要' ? '不推荐（无收入，寿险非必需）'
    : '不推荐（父母寿险非必需，建议医疗/意外险）';

  // ══════════ 汇总 ══════════
  const totalHealthGap = Math.max(0, round2(totalHealthGap1 + totalHealthGap2 - liquidAsset * alpha));
  const totalLifeGap = round2(lifeGap1 + lifeGap2);
  const totalPensionGap = round2(retireGap1 + retireGap2);
  const totalGap = round2(totalHealthGap + totalLifeGap + totalPensionGap);

  const totalAnnualPrem = round2(totalHealthPrem1 + totalHealthPrem2 + estLifePrem1 + estLifePrem2 + recPension1 + recPension2);
  const premiumToIncomeRatio = householdIncome > 0 ? round2(totalAnnualPrem / householdIncome) : 99;
  const weightedPrem = (totalHealthPrem1 + totalHealthPrem2) * 0.85 + (estLifePrem1 + estLifePrem2) * 0.35 + (recPension1 + recPension2) * 0.25;
  const riskIndex = householdIncome > 0 ? round2(weightedPrem / householdIncome * 100) : 99;
  const riskLevel = riskIndex <= 3.5 ? '低风险' : riskIndex <= 9 ? '中等风险' : '高风险';
  const priority = ciGap1 > 30 || ciGap2 > 30 ? '优先配置重疾险' : totalLifeGap > 50 ? '优先配置寿险' : totalPensionGap > 50 ? '优先补充养老金' : '全面配置健康保障';

  Object.assign(r, {
    totalGap, riskLevel, riskIndex, priority,
    totalHealthGap, totalLifeGap, totalPensionGap, totalAnnualPrem, premiumToIncomeRatio,
    alpha, liquidAsset, isDun,
    ciPayPeriod: d.ciPayPeriod,
  });

  r.firstPerson = {
    recCI: recCI1, ciGap: ciGap1, recMI: expectedMedical1, miGap: miGap1, totalHealthGap: totalHealthGap1,
    recMIType: recMIType1, miReason: miReason1, estCIPrem: estCIPrem1, estMIPrem: estMIPrem1, totalHealthPrem: totalHealthPrem1, healthBudget: healthBudget1,
    recLife: recLife1, existingLife: existingLife1, lifeGap: lifeGap1, estLifePrem: estLifePrem1, lifeBudget: lifeBudget1, lifeTerm: lifeTerm1,
    recPension: recPension1, existingPensionFV: existingReserveFV1, annualRetireGoal: goalActual1, pensionGap: retireGap1, payYears: payYears1, pensionBudget: pensionBudget1,
  };
  r.secondPerson = {
    recCI: recCI2, ciGap: ciGap2, recMI: expectedMedical2, miGap: miGap2, totalHealthGap: totalHealthGap2,
    recMIType: recMIType2, miReason: miReason2, estCIPrem: estCIPrem2, estMIPrem: estMIPrem2, totalHealthPrem: totalHealthPrem2, healthBudget: healthBudget2,
    recLife: recLife2, existingLife: existingLife2, lifeGap: lifeGap2, estLifePrem: estLifePrem2, lifeBudget: lifeBudget2, lifeTerm: lifeTerm2,
    recPension: recPension2, existingPensionFV: existingReserveFV2, annualRetireGoal: goalActual2, pensionGap: retireGap2, payYears: payYears2, pensionBudget: pensionBudget2,
  };
  r.child = {
    recCI: childCIRec, existingCI: Number(d.childCIExisting) || 0, ciGap: childCIGap,
    recMIType: childMIType, miReason: childMIReason, recLife: childLifeRec, lifeConclusion: childLifeConclusion,
  };
  r.parent = {
    existingCI: Number(d.parentCIExisting) || 0,
    recMIType: parentMIType, miReason: parentMIReason, lifeConclusion: parentLifeConclusion,
  };

  return r;
}

export { calculate };
