export type NumericMetric = number | null;

export type ProductConfigInput = {
  id?: string;
  name: string;
  sku?: string | null;
  defaultSalePrice: number;
  defaultProductCost: number;
  defaultShippingCost: number;
  defaultPaymentGatewayCost: number;
  notes?: string | null;
  isActive?: boolean;
};

export type ProductConfigRecord = ProductConfigInput & {
  id: string;
  ownerId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DailyProcessInput = {
  id?: string;
  productId: string;
  processDate: string;
  adSpend: number;
  salePrice: number;
  totalSales: number;
  unitsSold: number;
  productCost: number;
  shippingCost: number;
  paymentGatewayCost: number;
  notes?: string | null;
};

export type DailyProcessRecord = DailyProcessInput & {
  id: string;
  productName?: string | null;
  productSku?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyProcessMetrics = {
  grossProfit: number;
  netProfit: number;
  netDayProfit: number;
  accumulatedNet: number;
  grossMargin: NumericMetric;
  netMargin: NumericMetric;
  costPerUnit: NumericMetric;
  averageSalePerUnit: NumericMetric;
  adSpendPerUnit: NumericMetric;
  acquisitionCostPerSale: NumericMetric;
  roas: NumericMetric;
  breakEvenSales: NumericMetric;
};

export type EnrichedDailyProcess = DailyProcessRecord & DailyProcessMetrics;

export type AlertTone = "success" | "warning" | "danger" | "info";

export type InsightAlert = {
  title: string;
  message: string;
  tone: AlertTone;
};

export type MetricCardData = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
};

export type TrendPoint = {
  label: string;
  date: string;
  sales: number;
  netProfit: number;
  adSpend: number;
  roas: NumericMetric;
  netMargin: NumericMetric;
  accumulatedNet: number;
  unitsSold: number;
  productId: string;
  productName?: string | null;
  acquisitionCostPerSale: NumericMetric;
};

export type AggregatePoint = {
  label: string;
  sales: number;
  netProfit: number;
  adSpend: number;
  unitsSold: number;
};

export type DashboardSnapshot = {
  totalSales: number;
  totalNetProfit: number;
  accumulatedNet: number;
  averageRoas: NumericMetric;
  averageNetMargin: NumericMetric;
  totalUnits: number;
  latestRecord: EnrichedDailyProcess | null;
  metricCards: MetricCardData[];
  alerts: InsightAlert[];
  recentTrend: TrendPoint[];
};

export type AnalyticsSnapshot = {
  summaryCards: MetricCardData[];
  dailyTrend: TrendPoint[];
  weeklyTrend: AggregatePoint[];
  monthlyTrend: AggregatePoint[];
  topDays: EnrichedDailyProcess[];
  lossDays: EnrichedDailyProcess[];
};

export type DailyProcessActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof DailyProcessInput, string>>;
  recordId?: string;
};

export type ProductActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ProductConfigInput, string>>;
  recordId?: string;
};
