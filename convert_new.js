const fs = require('fs');
const path = require('path');

const SRC = 'D:\\mont\\งาน\\เมืองแกพิทยาสรรค์\\งานวิชาการ\\2569\\ตารางเรียน1-2569\\3-6-69 ครั้งสุดท้าย\\schedule_2569_edited (11).json';
const OUT = path.join(__dirname, 'teachers.json');

const TIMES = {
  1: {s:"08:40", e:"09:30"},
  2: {s:"09:30", e:"10:20"},
  3: {s:"10:20", e:"11:10"},
  4: {s:"11:10", e:"12:00"},
  5: {s:"13:00", e:"13:50"},
  6: {s:"13:50", e:"14:40"},
  7: {s:"14:40", e:"15:30"},
};

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const result = src.map(teacher => {
  const newSchedule = {};

  for (const [day, periods] of Object.entries(teacher.schedule)) {
    const sorted = [...periods].sort((a, b) => a.period - b.period);
    const converted = [];

    for (const cur of sorted) {
      const t = `${TIMES[cur.period].s}-${TIMES[cur.period].e}`;
      converted.push({ period: cur.period, isDouble: false, subject: cur.subject, class: cur.class, room: cur.room, time: t });
    }

    newSchedule[day] = converted;
  }

  return { name: teacher.n, shortName: teacher.dn, schedule: newSchedule };
});

fs.writeFileSync(OUT, JSON.stringify(result, null, 2), 'utf8');
console.log(`Done — ${result.length} teachers written to teachers.json`);

// Print quick summary of changes
result.forEach(t => {
  const total = Object.values(t.schedule).reduce((s, ps) => s + ps.length, 0);
  console.log(`  ${t.shortName}: ${total} slots`);
});
