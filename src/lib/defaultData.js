// 表单默认值（字段名与 calculator.js 严格一致，勿随意改名；与小程序 utils/defaultData.js 一致）

function defaultFormData() {
  return {
    // ── 家庭与财务 ──
    firstPersonAge: 30,
    secondPersonAge: 28,
    childAge: 3,
    childCount: 1,
    parentSupportCount: 2,
    city: '北上广深',
    firstPersonGender: '男性',
    secondPersonGender: '女性',
    firstPersonIncome: '15-30万',
    secondPersonIncome: '15万以下',
    incomeStability: '较稳定（例如：大型企业核心岗）',
    incomeStability2: '较稳定（例如：大型企业核心岗）',
    mortgageBalance: '大于等于100万',
    otherLoanAmount: '无其他贷款',
    bankDeposit: '5-20万',
    lowRiskInvestment: '无',
    annualExpense: '10-20万',

    // ── 健康险 ──
    firstPersonHealthStatus: '优',
    secondPersonHealthStatus: '优',
    firstPersonSmoke: false,
    secondPersonSmoke: false,
    p1_期望医疗消费档位: 'B',
    p2_期望医疗消费档位: 'B',
    firstPersonCIExisting: 0,
    secondPersonCIExisting: 0,
    firstPersonMIExisting: 0,
    secondPersonMIExisting: 0,
    familyCoefficient: '稳健',
    ciPayPeriod: '20年',
    p1_社保医保: true, p1_惠民保: false, p1_百万医疗: false, p1_中端医疗: false, p1_高端医疗: false, p1_重疾险: false,
    p2_社保医保: true, p2_惠民保: false, p2_百万医疗: false, p2_中端医疗: false, p2_高端医疗: false, p2_重疾险: false,
    firstPersonCIPremiumBudget: '3-5万',
    secondPersonCIPremiumBudget: '3-5万',
    firstPersonMIPremiumBudget: '0.5-1万',
    secondPersonMIPremiumBudget: '0.5-1万',

    // ── 寿险 ──
    firstPersonHasLifeIns: false,
    secondPersonHasLifeIns: false,
    firstPersonLifeCoverage: '30-50万',
    secondPersonLifeCoverage: '30-50万',
    firstPersonExistingLifeYears: '10-20年',
    secondPersonExistingLifeYears: '10-20年',
    firstPersonLifeTerm: '63岁',
    secondPersonLifeTerm: '63岁',
    firstPersonLifeBudget: 1,
    secondPersonLifeBudget: 1,

    // ── 养老金 ──
    firstPersonRetireAge: '60-64岁',
    secondPersonRetireAge: '60-64岁',
    firstPersonRetireYears: '10-19年',
    secondPersonRetireYears: '10-19年',
    firstPersonRetireGoal: '10-20万',
    secondPersonRetireGoal: '10-20万',
    firstPersonPensionFund: '无',
    secondPersonPensionFund: '无',
    firstPersonComPension: '无',
    secondPersonComPension: '无',
    firstPersonPersonalPension: '无',
    secondPersonPersonalPension: '无',
    firstPersonSocialPension: '0.2-0.5万',
    secondPersonSocialPension: '0.2-0.5万',
    firstPersonPayYears: '20年',
    secondPersonPayYears: '20年',
    firstPersonPensionBudget: '3-5万',
    secondPersonPensionBudget: '3-5万',

    // ── 子女 / 父母 ──
    childParentLifeIns: '都不需要',
    child_社保医保: true, child_惠民保: false, child_百万医疗: false, child_中端医疗: false, child_高端医疗: false, child_重疾险: false,
    childCIExisting: 0,
    childMIPremiumBudget: '0.5-1万',
    parent_社保医保: true, parent_惠民保: false, parent_百万医疗: false, parent_中端医疗: false, parent_高端医疗: false, parent_重疾险: false,
    parentCIExisting: 0,
    parentMIPremiumBudget: '0.5-1万',
  };
}

export { defaultFormData };
