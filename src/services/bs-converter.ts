import NepaliDate from 'nepali-date-converter';

export const BS_MONTH_NAMES_EN = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const BS_MONTH_NAMES_NP = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'
];

export interface FormattedBSDate {
  year: number;
  month: number;
  day: number;
  monthNameEn: string;
  monthNameNp: string;
  formattedEn: string;
  formattedNp: string;
}

export function adToBs(date: Date): FormattedBSDate {
  try {
    const bs = new NepaliDate(date);
    const year = bs.getYear();
    const month = bs.getMonth(); // 0-indexed
    const day = bs.getDate();

    const monthNameEn = BS_MONTH_NAMES_EN[month] || 'Baishakh';
    const monthNameNp = BS_MONTH_NAMES_NP[month] || 'बैशाख';

    return {
      year,
      month: month + 1,
      day,
      monthNameEn,
      monthNameNp,
      formattedEn: `${monthNameEn} ${day}, ${year} B.S.`,
      formattedNp: `${monthNameNp} ${day}, ${year} वि.सं.`
    };
  } catch {
    // Fallback if out of bounds
    return {
      year: 2083,
      month: 5,
      day: 18,
      monthNameEn: 'Bhadra',
      monthNameNp: 'भदौ',
      formattedEn: 'Bhadra 18, 2083 B.S.',
      formattedNp: 'भदौ १८, २०८३ वि.सं.'
    };
  }
}

export function bsToAd(year: number, month1Indexed: number, day: number): Date {
  try {
    const bs = new NepaliDate(year, month1Indexed - 1, day);
    return bs.toJsDate();
  } catch {
    return new Date();
  }
}
