// BMI 계산 결과 타입
export interface HealthResult {
  bmi: number;
  bmiCategory: string;
  bmiColor: string;
  bmr: number; // 기초대사량
  tdee: number; // 총 일일 에너지 소비량
  idealWeightMin: number;
  idealWeightMax: number;
  weightStatus: string;
  weightDiff: number; // 정상 체중과의 차이
}

// 목표 체중 시뮬레이션 결과
export interface GoalSimulation {
  targetWeight: number;
  weightToLose: number;
  dailyDeficit: number;
  daysToGoal: number;
  weeksToGoal: number;
}

// BMI 카테고리 (WHO 기준)
const BMI_CATEGORIES = [
  { max: 18.5, label: '저체중', color: '#3498db' },
  { max: 23, label: '정상', color: '#27ae60' },
  { max: 25, label: '과체중', color: '#f39c12' },
  { max: 30, label: '비만 1단계', color: '#e74c3c' },
  { max: 35, label: '비만 2단계', color: '#c0392b' },
  { max: Infinity, label: '고도비만', color: '#8e44ad' },
];

// 활동 수준별 계수
export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: '비활동적', desc: '운동 거의 안함', factor: 1.2 },
  { key: 'light', label: '가벼운 활동', desc: '주 1-3회 운동', factor: 1.375 },
  { key: 'moderate', label: '보통 활동', desc: '주 3-5회 운동', factor: 1.55 },
  { key: 'active', label: '활동적', desc: '주 6-7회 운동', factor: 1.725 },
  { key: 'veryActive', label: '매우 활동적', desc: '고강도 운동/육체 노동', factor: 1.9 },
];

// BMI 계산
export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

// BMI 카테고리 판정
function getBMICategory(bmi: number): { label: string; color: string } {
  for (const cat of BMI_CATEGORIES) {
    if (bmi < cat.max) {
      return { label: cat.label, color: cat.color };
    }
  }
  return { label: '고도비만', color: '#8e44ad' };
}

// 기초대사량 계산 (Mifflin-St Jeor 공식)
function calculateBMR(weight: number, heightCm: number, age: number, isMale: boolean): number {
  const base = 10 * weight + 6.25 * heightCm - 5 * age;
  return isMale ? base + 5 : base - 161;
}

// 적정 체중 범위 계산 (BMI 18.5~23 기준)
function calculateIdealWeight(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM * 10) / 10,
    max: Math.round(23 * heightM * heightM * 10) / 10,
  };
}

// 건강 지수 계산
export function calculateHealth(
  weight: number,
  heightCm: number,
  age: number,
  isMale: boolean,
  activityLevel: string
): HealthResult {
  const bmi = calculateBMI(weight, heightCm);
  const { label: bmiCategory, color: bmiColor } = getBMICategory(bmi);
  const bmr = calculateBMR(weight, heightCm, age, isMale);

  const activity = ACTIVITY_LEVELS.find(a => a.key === activityLevel) || ACTIVITY_LEVELS[0];
  const tdee = Math.round(bmr * activity.factor);

  const { min: idealWeightMin, max: idealWeightMax } = calculateIdealWeight(heightCm);

  let weightStatus = '';
  let weightDiff = 0;

  if (weight < idealWeightMin) {
    weightStatus = '저체중';
    weightDiff = idealWeightMin - weight;
  } else if (weight > idealWeightMax) {
    weightStatus = '과체중';
    weightDiff = weight - idealWeightMax;
  } else {
    weightStatus = '정상';
    weightDiff = 0;
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
    bmiColor,
    bmr: Math.round(bmr),
    tdee,
    idealWeightMin,
    idealWeightMax,
    weightStatus,
    weightDiff: Math.round(weightDiff * 10) / 10,
  };
}

// 목표 체중 시뮬레이션 (차별화 기능)
export function simulateGoal(
  currentWeight: number,
  targetWeight: number,
  tdee: number
): GoalSimulation | null {
  const weightToLose = currentWeight - targetWeight;

  if (weightToLose <= 0) return null; // 체중 감량만 지원

  // 1kg 감량 = 약 7700kcal 적자 필요
  const totalCalorieDeficit = weightToLose * 7700;

  // 안전한 일일 적자량 (500-1000kcal)
  const dailyDeficit = Math.min(Math.max(tdee * 0.2, 500), 1000);

  const daysToGoal = Math.ceil(totalCalorieDeficit / dailyDeficit);
  const weeksToGoal = Math.ceil(daysToGoal / 7);

  return {
    targetWeight,
    weightToLose: Math.round(weightToLose * 10) / 10,
    dailyDeficit: Math.round(dailyDeficit),
    daysToGoal,
    weeksToGoal,
  };
}

// 포맷 함수
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}
