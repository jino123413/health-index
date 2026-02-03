import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, TextField, Button } from '@toss/tds-react-native';
import { GoogleAdMob } from '@apps-in-toss/framework';
import {
  calculateHealth,
  simulateGoal,
  formatNumber,
  ACTIVITY_LEVELS,
  type HealthResult,
  type GoalSimulation,
} from '../utils/healthCalculator';

const INTERSTITIAL_AD_ID = 'ait.v2.live.8f9a6430b4a54d1b';
const PRIMARY = '#00BFA5';

type Gender = 'male' | 'female';

export default function HealthCalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [targetWeight, setTargetWeight] = useState('');

  const [result, setResult] = useState<HealthResult | null>(null);
  const [goalSimulation, setGoalSimulation] = useState<GoalSimulation | null>(null);

  const adLoadedRef = useRef(false);
  const adAvailableRef = useRef(false);

  const loadAd = () => {
    try {
      if (!GoogleAdMob || typeof GoogleAdMob.loadAppsInTossAdMob !== 'function') {
        adAvailableRef.current = false;
        return;
      }
      adAvailableRef.current = true;
      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId: INTERSTITIAL_AD_ID },
        onEvent: (event: any) => {
          if (event.type === 'loaded') adLoadedRef.current = true;
        },
        onError: () => { adLoadedRef.current = false; },
      });
    } catch {
      adAvailableRef.current = false;
    }
  };

  useEffect(() => { loadAd(); }, []);

  const performCalculation = () => {
    const h = parseInt(height, 10);
    const w = parseFloat(weight);
    const a = parseInt(age, 10);

    if (isNaN(h) || isNaN(w) || isNaN(a) || h <= 0 || w <= 0 || a <= 0) return;

    const healthResult = calculateHealth(w, h, a, gender === 'male', activityLevel);
    setResult(healthResult);

    // 목표 체중 시뮬레이션
    if (targetWeight) {
      const target = parseFloat(targetWeight);
      if (!isNaN(target) && target > 0 && target < w) {
        setGoalSimulation(simulateGoal(w, target, healthResult.tdee));
      } else {
        setGoalSimulation(null);
      }
    } else {
      setGoalSimulation(null);
    }
  };

  // 계산하기 (광고 없이 바로 실행)
  const handleCalculate = () => {
    performCalculation();
  };

  // 새로 계산하기 (광고 표시 후 초기화)
  const handleReset = () => {
    if (!adAvailableRef.current || !adLoadedRef.current) {
      resetCalculation();
      return;
    }
    try {
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: INTERSTITIAL_AD_ID },
        onEvent: (event: any) => {
          if (event.type === 'dismissed') {
            resetCalculation();
            adLoadedRef.current = false;
            loadAd();
          }
        },
        onError: () => {
          resetCalculation();
          adLoadedRef.current = false;
          loadAd();
        },
      });
    } catch {
      resetCalculation();
    }
  };

  const resetCalculation = () => {
    setResult(null);
    setGoalSimulation(null);
    setHeight('');
    setWeight('');
    setAge('');
    setTargetWeight('');
  };

  const isValid = height && weight && age;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text typography="h4" fontWeight="bold" style={styles.headerTitle}>
          헬스인덱스
        </Text>
        <Text typography="body3" style={styles.headerSub}>
          BMI · 기초대사량 · 목표체중 시뮬레이터
        </Text>
      </View>

      {/* 기본 정보 입력 */}
      <View style={styles.card}>
        <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>신체 정보</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextField
              variant="box"
              label="키 (cm)"
              value={height}
              onChangeText={(t) => setHeight(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="170"
            />
          </View>
          <View style={styles.halfInput}>
            <TextField
              variant="box"
              label="체중 (kg)"
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="70"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <TextField
              variant="box"
              label="나이"
              value={age}
              onChangeText={(t) => setAge(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="30"
            />
          </View>
          <View style={styles.halfInput}>
            <Text typography="body3" style={styles.inputLabel}>성별</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
              >
                <Text
                  typography="body3"
                  fontWeight={gender === 'male' ? 'bold' : 'regular'}
                  style={gender === 'male' ? styles.genderTextActive : styles.genderText}
                >
                  남성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
              >
                <Text
                  typography="body3"
                  fontWeight={gender === 'female' ? 'bold' : 'regular'}
                  style={gender === 'female' ? styles.genderTextActive : styles.genderText}
                >
                  여성
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* 활동량 선택 */}
      <View style={styles.card}>
        <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>활동량</Text>
        <View style={styles.activityGrid}>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[styles.activityBtn, activityLevel === level.key && styles.activityBtnActive]}
              onPress={() => setActivityLevel(level.key)}
            >
              <Text
                typography="body3"
                fontWeight={activityLevel === level.key ? 'bold' : 'regular'}
                style={activityLevel === level.key ? styles.activityTextActive : styles.activityText}
              >
                {level.label}
              </Text>
              <Text typography="body3" style={styles.activityDesc}>{level.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 목표 체중 (차별화 기능) */}
      <View style={styles.card}>
        <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>
          목표 체중 시뮬레이션 (선택)
        </Text>
        <TextField
          variant="box"
          label="목표 체중 (kg)"
          value={targetWeight}
          onChangeText={(t) => setTargetWeight(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="현재 체중보다 낮게 입력"
        />
        <Text typography="body3" style={styles.inputHint}>
          목표 체중을 입력하면 달성 예상 기간을 계산해드려요
        </Text>
      </View>

      {/* 계산 버튼 */}
      <View style={styles.buttonWrapper}>
        <Button size="large" onPress={handleCalculate} disabled={!isValid}>
          건강지수 계산하기
        </Button>
      </View>

      {/* 결과 */}
      {result && (
        <>
          {/* BMI 결과 */}
          <View style={[styles.resultCard, { borderLeftColor: result.bmiColor }]}>
            <View style={styles.bmiHeader}>
              <Text typography="h2" fontWeight="bold" style={{ color: result.bmiColor }}>
                {result.bmi}
              </Text>
              <View style={styles.bmiLabelBox}>
                <Text typography="body2" fontWeight="bold" style={{ color: result.bmiColor }}>
                  {result.bmiCategory}
                </Text>
              </View>
            </View>
            <Text typography="body3" style={styles.greyText}>체질량지수 (BMI)</Text>

            <View style={styles.idealWeightRow}>
              <Text typography="body3" style={styles.greyText}>적정 체중 범위</Text>
              <Text typography="body2" fontWeight="semiBold">
                {result.idealWeightMin}kg ~ {result.idealWeightMax}kg
              </Text>
            </View>

            {result.weightStatus !== '정상' && (
              <View style={styles.weightDiffBox}>
                <Text typography="body3" style={styles.weightDiffText}>
                  정상 범위까지 {result.weightStatus === '저체중' ? '+' : '-'}{result.weightDiff}kg
                </Text>
              </View>
            )}
          </View>

          {/* 기초대사량 & 권장 칼로리 */}
          <View style={styles.card}>
            <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>일일 칼로리</Text>
            <View style={styles.calorieRow}>
              <View style={styles.calorieBox}>
                <Text typography="body3" style={styles.greyText}>기초대사량 (BMR)</Text>
                <Text typography="h5" fontWeight="bold">{formatNumber(result.bmr)}</Text>
                <Text typography="body3" style={styles.greyText}>kcal</Text>
              </View>
              <View style={styles.calorieDivider} />
              <View style={styles.calorieBox}>
                <Text typography="body3" style={styles.greyText}>권장 섭취량 (TDEE)</Text>
                <Text typography="h5" fontWeight="bold" style={styles.primaryText}>
                  {formatNumber(result.tdee)}
                </Text>
                <Text typography="body3" style={styles.greyText}>kcal</Text>
              </View>
            </View>
            <Text typography="body3" style={styles.calorieHint}>
              체중 유지를 위해 하루 {formatNumber(result.tdee)}kcal 섭취를 권장합니다
            </Text>
          </View>

          {/* 목표 체중 시뮬레이션 결과 */}
          {goalSimulation && (
            <View style={[styles.card, styles.goalCard]}>
              <Text typography="body2" fontWeight="bold" style={styles.goalTitle}>
                🎯 목표 달성 시뮬레이션
              </Text>
              <View style={styles.goalRow}>
                <Text typography="body3" style={styles.greyText}>감량 목표</Text>
                <Text typography="body1" fontWeight="bold">-{goalSimulation.weightToLose}kg</Text>
              </View>
              <View style={styles.goalRow}>
                <Text typography="body3" style={styles.greyText}>일일 칼로리 적자</Text>
                <Text typography="body1" fontWeight="bold" style={styles.primaryText}>
                  -{formatNumber(goalSimulation.dailyDeficit)}kcal
                </Text>
              </View>
              <View style={styles.goalRow}>
                <Text typography="body3" style={styles.greyText}>예상 소요 기간</Text>
                <Text typography="body1" fontWeight="bold">
                  약 {goalSimulation.weeksToGoal}주 ({goalSimulation.daysToGoal}일)
                </Text>
              </View>
              <Text typography="body3" style={styles.goalHint}>
                하루 {formatNumber(result.tdee - goalSimulation.dailyDeficit)}kcal 섭취 시 예상 기간입니다
              </Text>
            </View>
          )}

          {/* 새로 계산하기 버튼 */}
          <View style={styles.resetButtonContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
              <Text typography="body2" fontWeight="bold" style={styles.resetButtonText}>
                새로 계산하기
              </Text>
            </TouchableOpacity>
            <Text typography="body3" style={styles.adNotice}>
              광고 시청 후 새로운 계산을 시작합니다
            </Text>
          </View>
        </>
      )}

      {/* 안내 */}
      <View style={styles.notice}>
        <Text typography="body3" style={styles.noticeText}>
          계산 결과는 참고용이며, 정확한 건강 상담은 전문가와 상담하세요.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { padding: 16, paddingBottom: 40 },
  header: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  headerTitle: { color: '#FFFFFF' },
  headerSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: { marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  halfInput: { flex: 1 },
  inputLabel: { color: '#6B7684', marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: PRIMARY },
  genderText: { color: '#6B7684' },
  genderTextActive: { color: '#FFFFFF' },
  activityGrid: { gap: 8 },
  activityBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F4F4F4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityBtnActive: { backgroundColor: PRIMARY },
  activityText: { color: '#333' },
  activityTextActive: { color: '#FFFFFF' },
  activityDesc: { color: '#999', fontSize: 12 },
  inputHint: { color: '#999', marginTop: 8 },
  buttonWrapper: { marginBottom: 12 },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bmiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bmiLabelBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F4F4F4',
  },
  greyText: { color: '#6B7684' },
  idealWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  weightDiffBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  weightDiffText: { color: '#E65100', textAlign: 'center' },
  calorieRow: { flexDirection: 'row', alignItems: 'center' },
  calorieBox: { flex: 1, alignItems: 'center' },
  calorieDivider: { width: 1, height: 50, backgroundColor: '#F0F0F0' },
  primaryText: { color: PRIMARY },
  calorieHint: { color: '#999', textAlign: 'center', marginTop: 12 },
  goalCard: { backgroundColor: '#E8F5E9' },
  goalTitle: { color: '#2E7D32', marginBottom: 12 },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  goalHint: { color: '#666', marginTop: 12, textAlign: 'center' },
  resetButtonContainer: { alignItems: 'center', marginBottom: 12 },
  resetButton: {
    backgroundColor: '#F4F4F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: { color: '#6B7684' },
  notice: { paddingHorizontal: 4, marginTop: 4 },
  noticeText: { color: '#BBB', textAlign: 'center', lineHeight: 18 },
  adNotice: { color: '#999', textAlign: 'center', marginTop: 8, fontSize: 12 },
});
