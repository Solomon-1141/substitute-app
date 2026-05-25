'use strict';
// convert_schedule.js — แปลง schedule_2569_edited (สมบูรณ์).json → teachers.json
// รัน: node convert_schedule.js

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(
  'D:/mont/งาน/เมืองแกพิทยาสรรค์/งานวิชาการ/2569/ตารางเรียน1-2569',
  'ตารางเรียน 1-69(สมบูรณ์จริงๆ)',
  'schedule_2569_edited (สมบูรณ์).json'
);
const DEST = path.join(__dirname, 'teachers.json');
const DAYS = ['จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์'];

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const output = raw.map(t => {
  const newSched = {};

  DAYS.forEach(day => {
    const periods = (t.schedule?.[day] || []).slice().sort((a, b) => a.period - b.period);
    if (periods.length === 0) { newSched[day] = []; return; }

    // ตรวจ double: period N และ N+1 มี subject+class+room เหมือนกัน
    const doubled = new Set();
    for (let i = 0; i < periods.length - 1; i++) {
      const a = periods[i], b = periods[i + 1];
      if (
        b.period === a.period + 1 &&
        a.subject === b.subject &&
        a.class   === b.class   &&
        a.room    === b.room
      ) {
        doubled.add(i);
        doubled.add(i + 1);
      }
    }

    // สร้าง entries ใหม่ (deduplicate double — เก็บเฉพาะตัวแรกของคู่ที่ต่อกัน)
    const entries = [];
    let skip = false;
    for (let i = 0; i < periods.length; i++) {
      if (skip) { skip = false; continue; }
      const p = periods[i];
      const isDouble = doubled.has(i);

      if (isDouble && i + 1 < periods.length && doubled.has(i + 1) &&
          periods[i + 1].period === p.period + 1 &&
          periods[i + 1].subject === p.subject) {
        // merge time ของ 2 period
        const tStart = p.time.split('-')[0];
        const tEnd   = periods[i + 1].time.split('-')[1];
        entries.push({
          period:   p.period,
          isDouble: true,
          subject:  p.subject,
          class:    p.class,
          room:     p.room,
          time:     `${tStart}-${tEnd}`
        });
        // เพิ่ม entry ที่ 2 ด้วย (app อ่านทั้งคู่เพื่อหา getPairNums)
        entries.push({
          period:   periods[i + 1].period,
          isDouble: true,
          subject:  periods[i + 1].subject,
          class:    periods[i + 1].class,
          room:     periods[i + 1].room,
          time:     `${tStart}-${tEnd}`
        });
        skip = true;
      } else {
        entries.push({
          period:   p.period,
          isDouble: false,
          subject:  p.subject,
          class:    p.class,
          room:     p.room,
          time:     p.time
        });
      }
    }

    newSched[day] = entries;
  });

  return {
    name:      t.n,
    shortName: t.dn,
    schedule:  newSched
  };
});

fs.writeFileSync(DEST, JSON.stringify(output, null, 2), 'utf8');

// ── สรุปผล ──────────────────────────────────────────────────────────
console.log(`\nแปลงเสร็จ → ${DEST}`);
console.log(`ครูทั้งหมด: ${output.length} คน`);
const withSched = output.filter(t => DAYS.some(d => t.schedule[d]?.length > 0));
console.log(`มีตารางสอน: ${withSched.length} คน`);

// แสดง double period ที่พบ
let dCount = 0;
output.forEach(t => {
  DAYS.forEach(day => {
    const doubles = (t.schedule[day] || []).filter(e => e.isDouble);
    if (doubles.length) {
      dCount += doubles.length / 2;
    }
  });
});
console.log(`Double periods พบ: ${dCount} คู่`);

// ตรวจครู 3 คนแรก
console.log('\nตัวอย่าง (3 ครูแรก):');
output.slice(0, 3).forEach(t => {
  const total = DAYS.reduce((s, d) => s + (t.schedule[d]?.length || 0), 0);
  console.log(`  ${t.name} (${t.shortName}) — รวม ${total} คาบ`);
});
