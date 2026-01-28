// 2025년 기준 한국 급여 공제 계산

export type SalaryResult = {
  annualSalary: number;
  monthlySalary: number;
  nationalPension: number;    // 국민연금
  healthInsurance: number;    // 건강보험
  longTermCare: number;       // 장기요양보험
  employmentInsurance: number; // 고용보험
  incomeTax: number;          // 소득세
  localIncomeTax: number;     // 지방소득세
  totalDeductions: number;    // 공제 합계
  netMonthly: number;         // 월 실수령액
  netAnnual: number;          // 연 실수령액
  deductionRate: number;      // 공제율 (%)
};

// 4대보험 요율 (2025년 기준, 근로자 부담분)
const NATIONAL_PENSION_RATE = 0.045;        // 국민연금 4.5%
const NATIONAL_PENSION_MAX = 5_900_000;     // 기준소득월액 상한
const NATIONAL_PENSION_MIN = 390_000;       // 기준소득월액 하한
const HEALTH_INSURANCE_RATE = 0.03545;      // 건강보험 3.545%
const LONG_TERM_CARE_RATE = 0.1295;         // 장기요양 (건강보험의 12.95%)
const EMPLOYMENT_INSURANCE_RATE = 0.009;    // 고용보험 0.9%

// 근로소득공제
function getEarnedIncomeDeduction(annual: number): number {
  if (annual <= 5_000_000) return annual * 0.7;
  if (annual <= 15_000_000) return 3_500_000 + (annual - 5_000_000) * 0.4;
  if (annual <= 45_000_000) return 7_500_000 + (annual - 15_000_000) * 0.15;
  if (annual <= 100_000_000) return 12_000_000 + (annual - 45_000_000) * 0.05;
  return 14_750_000 + (annual - 100_000_000) * 0.02;
}

// 소득세 과세표준 구간별 세율
function getIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  if (taxableIncome <= 14_000_000) return taxableIncome * 0.06;
  if (taxableIncome <= 50_000_000) return 840_000 + (taxableIncome - 14_000_000) * 0.15;
  if (taxableIncome <= 88_000_000) return 6_240_000 + (taxableIncome - 50_000_000) * 0.24;
  if (taxableIncome <= 150_000_000) return 15_360_000 + (taxableIncome - 88_000_000) * 0.35;
  if (taxableIncome <= 300_000_000) return 37_060_000 + (taxableIncome - 150_000_000) * 0.38;
  if (taxableIncome <= 500_000_000) return 94_060_000 + (taxableIncome - 300_000_000) * 0.40;
  if (taxableIncome <= 1_000_000_000) return 174_060_000 + (taxableIncome - 500_000_000) * 0.42;
  return 384_060_000 + (taxableIncome - 1_000_000_000) * 0.45;
}

// 연봉 → 실수령액 계산
export function calculateSalary(annualSalary: number): SalaryResult {
  const monthly = Math.floor(annualSalary / 12);

  // 4대보험 (월 기준)
  const pensionBase = Math.min(Math.max(monthly, NATIONAL_PENSION_MIN), NATIONAL_PENSION_MAX);
  const nationalPension = Math.floor(pensionBase * NATIONAL_PENSION_RATE);
  const healthInsurance = Math.floor(monthly * HEALTH_INSURANCE_RATE);
  const longTermCare = Math.floor(healthInsurance * LONG_TERM_CARE_RATE);
  const employmentInsurance = Math.floor(monthly * EMPLOYMENT_INSURANCE_RATE);

  // 소득세 (연 기준 → 월 환산)
  const earnedDeduction = getEarnedIncomeDeduction(annualSalary);
  const personalDeduction = 1_500_000; // 본인 기본공제
  const taxableIncome = Math.max(annualSalary - earnedDeduction - personalDeduction, 0);
  const annualIncomeTax = getIncomeTax(taxableIncome);
  const incomeTax = Math.floor(annualIncomeTax / 12);
  const localIncomeTax = Math.floor(incomeTax * 0.1);

  const totalDeductions = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;
  const netMonthly = monthly - totalDeductions;

  return {
    annualSalary,
    monthlySalary: monthly,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeductions,
    netMonthly,
    netAnnual: netMonthly * 12,
    deductionRate: Math.round((totalDeductions / monthly) * 1000) / 10,
  };
}

// [차별화 기능] 희망 실수령액 → 필요 연봉 역산
export function reverseCalculate(desiredNetMonthly: number): SalaryResult {
  // 이진 탐색으로 역산 (실수령액은 연봉에 대해 단조증가)
  let low = desiredNetMonthly * 12;
  let high = desiredNetMonthly * 12 * 2.5; // 넉넉한 상한

  for (let i = 0; i < 100; i++) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateSalary(mid);

    if (Math.abs(result.netMonthly - desiredNetMonthly) < 1000) {
      // 만원 단위로 반올림
      const rounded = Math.ceil(mid / 10000) * 10000;
      return calculateSalary(rounded);
    }

    if (result.netMonthly < desiredNetMonthly) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const final = Math.ceil(((low + high) / 2) / 10000) * 10000;
  return calculateSalary(final);
}

// 금액 포맷
export function formatMoney(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

// 연봉 → 시급/분급/초급 변환 (재미 요소)
export function getTimeBreakdown(annualSalary: number) {
  const workDays = 252;   // 연간 근무일 (주5일, 공휴일 제외)
  const workHours = workDays * 8;
  const workMinutes = workHours * 60;

  const result = calculateSalary(annualSalary);
  const netAnnual = result.netAnnual;

  return {
    hourly: Math.floor(netAnnual / workHours),
    perMinute: Math.floor(netAnnual / workMinutes),
    daily: Math.floor(netAnnual / workDays),
  };
}
