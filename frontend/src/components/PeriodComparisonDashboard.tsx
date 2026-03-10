import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, 
  DollarSign, ShoppingCart, Users, CreditCard,
  Repeat, Heart, UserX, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface PeriodData {
  revenue: number;
  orders: number;
  customers: number;
  avgCheck: number;
  repeatRate: number;
  ltv: number;
  churnRate: number;
}

interface ComparisonMetric {
  name: string;
  icon: React.ReactNode;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  format: 'currency' | 'number' | 'percent';
  isPositive: boolean;
}

const PeriodComparisonDashboard: React.FC = 