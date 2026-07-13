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

export default { percentageOf, gradeFor, computeReportCard };
