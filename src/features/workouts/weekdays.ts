export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const formatWeekDays = (days: number[]) =>
  days.length === 0
    ? 'Sem dia fixo'
    : [...days].sort().map((d) => WEEKDAYS[d]).join(' · ');
