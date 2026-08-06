/**
 * Default grading scale. Schools can override via Settings in a future iteration;
 * kept as a pure function so it's easy to swap for a per-school configurable scale.
 */
const GRADE_SCALE = [
  { min: 90, grade: 'A+', gpa: 4.0 },
  { min: 80, grade: 'A', gpa: 3.7 },
  { min: 70, grade: 'B+', gpa: 3.3 },
  { min: 60, grade: 'B', gpa: 3.0 },
  { min: 50, grade: 'C+', gpa: 2.7 },
  { min: 40, grade: 'C', gpa: 2.3 },
  { min: 33, grade: 'D', gpa: 1.0 },
  { min: 0, grade: 'F', gpa: 0.0 },
];

export function percentageOf(obtained, total) {
  if (!total) return 0;
  return Math.round((obtained / total) * 10000) / 100;
}

export function gradeFor(percentage) {
  return GRADE_SCALE.find((tier) => percentage >= tier.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

/**
 * marks: [{ subject, obtained, total }]
 * Returns per-subject grade plus overall percentage/GPA/result.
 */
export function computeReportCard(marks) {
  const totals = marks.reduce(
    (acc, m) => {
      acc.obtained += m.obtained;
      acc.total += m.total;
      return acc;
    },
    { obtained: 0, total: 0 }
  );

  const subjects = marks.map((m) => {
    const pct = percentageOf(m.obtained, m.total);
    const tier = gradeFor(pct);
    return { ...m, percentage: pct, grade: tier.grade, gpa: tier.gpa, passed: pct >= 33 };
  });

  const overallPercentage = percentageOf(totals.obtained, totals.total);
  const overallTier = gradeFor(overallPercentage);
  const gpa = subjects.length
    ? Math.round((subjects.reduce((s, m) => s + m.gpa, 0) / subjects.length) * 100) / 100
    : 0;

  return {
    subjects,
    totalObtained: totals.obtained,
    totalMax: totals.total,
    percentage: overallPercentage,
    grade: overallTier.grade,
    gpa,
    result: subjects.every((s) => s.passed) ? 'PASS' : 'FAIL',
  };
}

/**
 * Combines multiple weighted assessments (assignment/quiz/midterm/final/
 * practical...) for a single subject into one score. Weights are normalized
 * against whatever's actually present, so a subject with only 2 of 5
 * categories recorded still produces a sensible percentage rather than one
 * silently deflated by the missing categories.
 *
 * entries: [{ obtained, total, weight, category }]
 */
export function computeWeightedSubjectScore(entries) {
  const totalWeight = entries.reduce((sum, e) => sum + (e.weight ?? 100), 0) || entries.length * 100;
  return (
    Math.round(
      entries.reduce((sum, e) => sum + percentageOf(e.obtained, e.total) * ((e.weight ?? 100) / totalWeight), 0) * 100
    ) / 100
  );
}

/**
 * subjectEntries: [{ subject, entries: [{ obtained, total, weight, category }] }]
 * Term-level equivalent of computeReportCard — each subject's score is first
 * weight-combined across all its assessments before rolling up to an overall
 * percentage/grade/GPA/pass-fail.
 */
export function computeTermReportCard(subjectEntries) {
  const subjects = subjectEntries.map(({ subject, entries }) => {
    const pct = computeWeightedSubjectScore(entries);
    const tier = gradeFor(pct);
    return { subject, percentage: pct, grade: tier.grade, gpa: tier.gpa, passed: pct >= 33, components: entries };
  });

  const overallPercentage = subjects.length
    ? Math.round((subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length) * 100) / 100
    : 0;
  const overallTier = gradeFor(overallPercentage);
  const gpa = subjects.length
    ? Math.round((subjects.reduce((sum, s) => sum + s.gpa, 0) / subjects.length) * 100) / 100
    : 0;

  return {
    subjects,
    percentage: overallPercentage,
    grade: overallTier.grade,
    gpa,
    result: subjects.every((s) => s.passed) ? 'PASS' : 'FAIL',
  };
}

/**
 * Ranks a list of { ...anything, percentage } by percentage descending,
 * with tied scores sharing the same rank (standard competition ranking:
 * 1, 2, 2, 4 rather than 1, 2, 2, 3).
 */
export function rankByPercentage(rows) {
  const sorted = [...rows].sort((a, b) => b.percentage - a.percentage);
  let lastPercentage = null;
  let lastRank = 0;
  return sorted.map((row, i) => {
    if (row.percentage !== lastPercentage) {
      lastRank = i + 1;
      lastPercentage = row.percentage;
    }
    return { ...row, rank: lastRank };
  });
}

export default {
  percentageOf,
  gradeFor,
  computeReportCard,
  computeWeightedSubjectScore,
  computeTermReportCard,
  rankByPercentage,
};
