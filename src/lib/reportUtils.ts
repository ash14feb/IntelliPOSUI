import {
  endOfDay,
  endOfMonth,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths
} from 'date-fns';
import { Order } from '../types';

export type ReportRangePreset = 'today' | 'yesterday' | 'previousDay' | 'thisMonth' | 'previousMonth' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getRangeFromPreset(preset: ReportRangePreset, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': {
      const day = subDays(now, 1);
      return { start: startOfDay(day), end: endOfDay(day) };
    }
    case 'previousDay': {
      const day = subDays(now, 2);
      return { start: startOfDay(day), end: endOfDay(day) };
    }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfDay(now) };
    case 'previousMonth': {
      const month = subMonths(now, 1);
      return { start: startOfMonth(month), end: endOfMonth(month) };
    }
    case 'custom':
      return {
        start: customStart ? startOfDay(new Date(customStart)) : startOfDay(now),
        end: customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now)
      };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export function filterOrdersByRange(orders: Order[], range: DateRange) {
  return orders.filter(order =>
    isWithinInterval(new Date(order.timestamp), {
      start: range.start,
      end: range.end
    })
  );
}

export function getRangeLabel(range: DateRange) {
  return `${format(range.start, 'dd MMM yyyy')} - ${format(range.end, 'dd MMM yyyy')}`;
}
