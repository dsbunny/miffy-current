//@ts-nocheck
import { Weekday, WeekdayStr } from './weekday'

export interface QueryMethods {
  all(): Date[]
  between(after: Date, before: Date, inc: boolean): Date[]
  before(date: Date, inc: boolean): Date
  after(date: Date, inc: boolean): Date
}

export type QueryMethodTypes = keyof QueryMethods
export type IterResultType<M extends QueryMethodTypes> = M extends
  | 'all'
  | 'between'
  ? Date[]
  : Date | null

export enum Frequency {
  YEARLY = 0,
  MONTHLY = 1,
  WEEKLY = 2,
  DAILY = 3,
  HOURLY = 4,
  MINUTELY = 5,
  SECONDLY = 6,
}

export function freqIsDailyOrGreater(
  freq: Frequency
): freq is
  | Frequency.YEARLY
  | Frequency.MONTHLY
  | Frequency.WEEKLY
  | Frequency.DAILY {
  return freq < Frequency.HOURLY
}

export interface Options {
  freq: Frequency
  dtstart: Date | null
  interval: number
  wkst: Weekday | number | null
  count: number | null
  until: Date | null
  tzid: string | null
  bysetpos: number | number[] | null
  bymonth: number | number[] | null
  bymonthday: number | number[] | null
  bynmonthday: number[] | null
  byyearday: number | number[] | null
  byweekno: number | number[] | null
  byweekday: ByWeekday | ByWeekday[] | null
  bynweekday: number[][] | null
  byhour: number | number[] | null
  byminute: number | number[] | null
  bysecond: number | number[] | null
  byeaster: number | null
}

export interface ParsedOptions extends Options {
  dtstart: Date
  wkst: number
  bysetpos: number[]
  bymonth: number[]
  bymonthday: number[]
  bynmonthday: number[]
  byyearday: number[]
  byweekno: number[]
  byweekday: number[]
  byhour: number[]
  byminute: number[]
  bysecond: number[]
}

export type ByWeekday = WeekdayStr | number | Weekday
