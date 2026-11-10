import { SectorCategory, SimulationInputs, SimulationResult } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';

export function calculateSimulation(inputs: SimulationInputs): SimulationResult {
  const {
    selectedSectorIds,
    startingCapital,
    weeklyHours,
    timeHorizonMonths,
    automationLevel,
    targetMonthlyExpense,
  } = inputs;

  const activeSectors = ECONOMIC_SECTORS.filter((s) =>
    selectedSectorIds.includes(s.id)
  );

  if (activeSectors.length === 0) {
    return {
      projectedMrr: 0,
      projectedArr: 0,
      projectedEbitda: 0,
      breakEvenMonth: 0,
      roiPercentage: 0,
      diversificationScore: 0,
      sectorBreakdown: [],
      monthlyTimeline: [],
    };
  }

  // Base parameters
  // Time and capital scaling factors
  const hoursMultiplier = Math.min(2.5, Math.max(0.4, weeklyHours / 25));
  const capitalLeverage = Math.min(3.0, 1 + (startingCapital / 10000) * 0.4);
  const automationEffortMultiplier = 1 + (automationLevel / 100) * 0.7; // higher automation expands capacity
  const globalCapacityFactor = hoursMultiplier * capitalLeverage * automationEffortMultiplier;

  // Diversification score based on number of distinct sectors and margin profile
  const sectorCount = activeSectors.length;
  const diversificationScore = Math.min(100, Math.round((sectorCount / 4) * 85 + (automationLevel > 50 ? 15 : 5)));

  // Calculate sector weights and individual trajectory
  const rawRevenues = activeSectors.map((sec) => {
    // Sector specific dynamics
    let baseMonthlyMaturity = 6000;
    if (sec.id === 'b2b_services') baseMonthlyMaturity = 9500;
    if (sec.id === 'ai_deeptech') baseMonthlyMaturity = 12000;
    if (sec.id === 'fintech') baseMonthlyMaturity = 14000;
    if (sec.id === 'cleantech') baseMonthlyMaturity = 11000;
    if (sec.id === 'proptech') baseMonthlyMaturity = 8500;
    if (sec.id === 'digital_commerce') baseMonthlyMaturity = 7500;

    // Weight influenced by sector margin
    const marginRatio = sec.averageMargin / 100;
    const finalSectorMrr = Math.round(
      baseMonthlyMaturity * marginRatio * (globalCapacityFactor / Math.sqrt(sectorCount))
    );

    return {
      sectorId: sec.id,
      name: sec.name,
      monthlyRevenue: finalSectorMrr,
      averageMargin: sec.averageMargin,
      speed: sec.cashFlowSpeed,
    };
  });

  const totalProjectedMrr = rawRevenues.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);

  const sectorBreakdown = rawRevenues.map((item) => ({
    sectorId: item.sectorId,
    name: item.name,
    monthlyRevenue: item.monthlyRevenue,
    sharePercent: totalProjectedMrr > 0 ? Math.round((item.monthlyRevenue / totalProjectedMrr) * 100) : 0,
  }));

  // Build monthly timeline
  const monthlyTimeline: SimulationResult['monthlyTimeline'] = [];
  let cumulativeCash = startingCapital;
  let breakEvenMonth = 0;

  for (let m = 1; m <= timeHorizonMonths; m++) {
    // S-curve ramp-up: rampFactor from 0.05 at month 1 to 1.0 at month 12
    const rampFactor = 1 / (1 + Math.exp(-0.45 * (m - 4.5)));
    const monthGrossRevenue = Math.round(totalProjectedMrr * rampFactor);

    // Operating costs: baseline tools, server, API, marketing + targetMonthlyExpense
    const variableCostRate = 0.22 - (automationLevel / 100) * 0.08; // 14% to 22%
    const fixedCost = targetMonthlyExpense + 250;
    const monthCosts = Math.round(fixedCost + monthGrossRevenue * variableCostRate);

    const netProfit = monthGrossRevenue - monthCosts;
    cumulativeCash += netProfit;

    if (cumulativeCash > startingCapital && breakEvenMonth === 0 && m > 1) {
      breakEvenMonth = m;
    }

    monthlyTimeline.push({
      month: m,
      revenue: monthGrossRevenue,
      costs: monthCosts,
      netProfit,
      cumulativeCash: Math.round(cumulativeCash),
    });
  }

  if (breakEvenMonth === 0) {
    // If not broken even yet, set to horizon + 1
    breakEvenMonth = Math.min(timeHorizonMonths, Math.ceil(startingCapital / Math.max(1, totalProjectedMrr * 0.3)));
  }

  const projectedArr = totalProjectedMrr * 12;
  const averageNetMargin = 0.65 + (automationLevel / 100) * 0.15;
  const projectedEbitda = Math.round(projectedArr * averageNetMargin);
  const netGain = cumulativeCash - startingCapital;
  const roiPercentage = startingCapital > 0 ? Math.round((netGain / startingCapital) * 100) : Math.round(netGain / 10);

  return {
    projectedMrr: totalProjectedMrr,
    projectedArr,
    projectedEbitda,
    breakEvenMonth,
    roiPercentage,
    diversificationScore,
    sectorBreakdown,
    monthlyTimeline,
  };
}
