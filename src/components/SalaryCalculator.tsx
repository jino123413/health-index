import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, TextField, Button } from '@toss/tds-react-native';
import { GoogleAdMob } from '@apps-in-toss/framework';
import { calculateSalary, reverseCalculate, formatMoney, getTimeBreakdown, type SalaryResult } from '../utils/taxCalculator';

const INTERSTITIAL_AD_ID = 'ait.v2.live.6a9582ec4e524364';
const PRIMARY = '#1B9C85';

type Mode = 'normal' | 'reverse';

export default function SalaryCalculator() {
  const [mode, setMode] = useState<Mode>('normal');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

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
    const amount = parseInt(inputValue.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount <= 0) return;

    setIsCalculating(true);

    if (mode === 'normal') {
      const salary = amount * 10000; // 만원 단위 입력
      setResult(calculateSalary(salary));
    } else {
      const desired = amount * 10000;
      setResult(reverseCalculate(desired));
    }

    setIsCalculating(false);
  };

  const handleCalculate = () => {
    if (!adAvailableRef.current || !adLoadedRef.current) {
      performCalculation();
      return;
    }
    try {
      GoogleAdMob.showAppsInTossAdMob({
        options: { adGroupId: INTERSTITIAL_AD_ID },
        onEvent: (event: any) => {
          if (event.type === 'dismissed') {
            performCalculation();
            adLoadedRef.current = false;
            loadAd();
          }
        },
        onError: () => {
          performCalculation();
          adLoadedRef.current = false;
          loadAd();
        },
      });
    } catch {
      performCalculation();
    }
  };

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setResult(null);
    setInputValue('');
  };

  const timeBreakdown = result ? getTimeBreakdown(result.annualSalary) : null;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text typography="h4" fontWeight="bold" style={styles.headerTitle}>
          페이체크
        </Text>
        <Text typography="body3" style={styles.headerSub}>
          연봉 실수령액 계산기
        </Text>
      </View>

      {/* 모드 선택 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, mode === 'normal' && styles.tabActive]}
          onPress={() => handleModeSwitch('normal')}
          activeOpacity={0.7}
        >
          <Text
            typography="body2"
            fontWeight={mode === 'normal' ? 'bold' : 'regular'}
            style={[styles.tabText, mode === 'normal' && styles.tabTextActive]}
          >
            연봉 > 실수령
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'reverse' && styles.tabActive]}
          onPress={() => handleModeSwitch('reverse')}
          activeOpacity={0.7}
        >
          <Text
            typography="body2"
            fontWeight={mode === 'reverse' ? 'bold' : 'regular'}
            style={[styles.tabText, mode === 'reverse' && styles.tabTextActive]}
          >
            실수령 > 연봉 역산
          </Text>
        </TouchableOpacity>
      </View>

      {/* 입력 카드 */}
      <View style={styles.card}>
        <Text typography="body2" fontWeight="bold" style={styles.inputLabel}>
          {mode === 'normal' ? '연봉 (만원)' : '희망 월 실수령액 (만원)'}
        </Text>
        <TextField
          variant="box"
          label={mode === 'normal' ? '연봉을 입력하세요' : '희망 실수령액을 입력하세요'}
          value={inputValue}
          onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder={mode === 'normal' ? '예: 4000' : '예: 300'}
        />
        <Text typography="body3" style={styles.inputHint}>
          {mode === 'normal'
            ? '세전 연봉을 만원 단위로 입력하세요 (예: 4000 = 4,000만원)'
            : '매달 받고 싶은 실수령액을 만원 단위로 입력하세요'}
        </Text>
      </View>

      {/* 계산 버튼 */}
      <View style={styles.buttonWrapper}>
        <Button size="large" onPress={handleCalculate} disabled={!inputValue || isCalculating}>
          {isCalculating ? '계산 중...' : '계산하기'}
        </Button>
      </View>

      {/* 결과 */}
      {result && (
        <>
          {/* 역산 모드일 때 필요 연봉 강조 */}
          {mode === 'reverse' && (
            <View style={styles.reverseCard}>
              <Text typography="body3" style={styles.reverseLabel}>필요 연봉</Text>
              <Text typography="h3" fontWeight="bold" style={styles.reverseAmount}>
                {formatMoney(result.annualSalary / 10000)}만원
              </Text>
              <Text typography="body3" style={styles.reverseHint}>
                월 {formatMoney(result.netMonthly)}원을 받으려면 이 연봉이 필요합니다
              </Text>
            </View>
          )}

          {/* 핵심 요약 */}
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text typography="body3" style={styles.summaryLabel}>세전 월급</Text>
                <Text typography="body1" fontWeight="bold">
                  {formatMoney(result.monthlySalary)}원
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text typography="body3" style={styles.summaryLabel}>월 실수령액</Text>
                <Text typography="body1" fontWeight="bold" style={styles.primaryText}>
                  {formatMoney(result.netMonthly)}원
                </Text>
              </View>
            </View>
            <View style={styles.rateBar}>
              <View style={[styles.rateBarFill, { width: `${100 - result.deductionRate}%` }]} />
            </View>
            <Text typography="body3" style={styles.rateText}>
              공제율 {result.deductionRate}% | 연 실수령 {formatMoney(result.netAnnual)}원
            </Text>
          </View>

          {/* 공제 상세 */}
          <View style={styles.card}>
            <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>공제 내역 (월)</Text>

            <View style={styles.deductionSection}>
              <Text typography="body3" fontWeight="bold" style={styles.deductionHeader}>4대보험</Text>
              <DeductionRow label="국민연금" amount={result.nationalPension} rate={4.5} />
              <DeductionRow label="건강보험" amount={result.healthInsurance} rate={3.545} />
              <DeductionRow label="장기요양보험" amount={result.longTermCare} />
              <DeductionRow label="고용보험" amount={result.employmentInsurance} rate={0.9} />
            </View>

            <View style={styles.deductionSection}>
              <Text typography="body3" fontWeight="bold" style={styles.deductionHeader}>세금</Text>
              <DeductionRow label="소득세" amount={result.incomeTax} />
              <DeductionRow label="지방소득세" amount={result.localIncomeTax} />
            </View>

            <View style={styles.totalRow}>
              <Text typography="body2" fontWeight="bold">공제 합계</Text>
              <Text typography="body2" fontWeight="bold" style={styles.redText}>
                -{formatMoney(result.totalDeductions)}원
              </Text>
            </View>
          </View>

          {/* 시간당 환산 (재미 요소) */}
          {timeBreakdown && (
            <View style={styles.card}>
              <Text typography="body2" fontWeight="bold" style={styles.sectionTitle}>
                실수령 기준 시간 환산
              </Text>
              <View style={styles.timeRow}>
                <TimeBox label="일급" amount={timeBreakdown.daily} />
                <TimeBox label="시급" amount={timeBreakdown.hourly} />
                <TimeBox label="분급" amount={timeBreakdown.perMinute} />
              </View>
            </View>
          )}
        </>
      )}

      {/* 안내 */}
      <View style={styles.notice}>
        <Text typography="body3" style={styles.noticeText}>
          2025년 4대보험 요율 기준이며, 부양가족 수에 따라 실제 금액과 차이가 있을 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
}

function DeductionRow({ label, amount, rate }: { label: string; amount: number; rate?: number }) {
  return (
    <View style={styles.deductionRow}>
      <View style={styles.deductionLeft}>
        <Text typography="body3" style={styles.deductionLabel}>{label}</Text>
        {rate !== undefined && (
          <Text typography="body3" style={styles.deductionRate}>{rate}%</Text>
        )}
      </View>
      <Text typography="body3" style={styles.deductionAmount}>
        -{formatMoney(amount)}원
      </Text>
    </View>
  );
}

function TimeBox({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.timeBox}>
      <Text typography="body3" style={styles.timeLabel}>{label}</Text>
      <Text typography="body2" fontWeight="bold">{formatMoney(amount)}원</Text>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { color: '#6B7684' },
  tabTextActive: { color: '#FFFFFF' },
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
  inputLabel: { marginBottom: 8 },
  inputHint: { color: '#999', marginTop: 8 },
  buttonWrapper: { marginBottom: 12 },
  reverseCard: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  reverseLabel: { color: 'rgba(255,255,255,0.8)' },
  reverseAmount: { color: '#FFFFFF', marginVertical: 4 },
  reverseHint: { color: 'rgba(255,255,255,0.7)' },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },
  summaryLabel: { color: '#6B7684', marginBottom: 4 },
  primaryText: { color: PRIMARY },
  rateBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  rateBarFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
  rateText: { color: '#999', textAlign: 'center', marginTop: 8 },
  sectionTitle: { marginBottom: 12 },
  deductionSection: { marginBottom: 12 },
  deductionHeader: { color: PRIMARY, marginBottom: 8 },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  deductionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deductionLabel: { color: '#333' },
  deductionRate: { color: '#999', fontSize: 11 },
  deductionAmount: { color: '#F04452' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  redText: { color: '#F04452' },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  timeLabel: { color: '#6B7684', marginBottom: 4 },
  notice: { paddingHorizontal: 4, marginTop: 4 },
  noticeText: { color: '#BBB', textAlign: 'center', lineHeight: 18 },
});
