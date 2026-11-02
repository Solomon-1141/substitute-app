// แปลงตารางสอนภาค 2/2569 (preplaced.json ฉบับ 30 ต.ค.) -> teachers.json + ฝังใน index.html
const fs = require('fs'); const path = require('path');
const SRC = 'D:/Claude ส่งงาน/งานวิชาการ_2569/ตารางสอน_2-2569/work/preplaced.json';
const TIMES = {1:'08:40-09:30',2:'09:30-10:20',3:'10:20-11:10',4:'11:10-12:00',5:'13:00-13:50',6:'13:50-14:40',7:'14:40-15:30'};
const DAYS = ['จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์'];
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const old = JSON.parse(fs.readFileSync(path.join(__dirname,'teachers_term1_2569.json'),'utf8'));
const fullName = {};
for (const c in src.CG) for (const d in src.CG[c]) for (const k in src.CG[c][d]) for (const e of src.CG[c][d][k]) fullName[e.dn] = e.name;
const order = old.map(t => t.shortName);
const result = order.map(dn => {
  const tg = src.TG[dn]; if (!tg) throw new Error('ไม่พบครู ' + dn);
  const schedule = {};
  for (const day of DAYS) {
    const list = [];
    for (let p = 1; p <= 7; p++) for (const e of (tg[day] && tg[day][p]) || [])
      list.push({ period: p, isDouble: false, subject: e.subj, class: e.cls, room: e.room, time: TIMES[p] });
    schedule[day] = list;
  }
  return { name: fullName[dn] || old.find(t => t.shortName === dn).name, shortName: dn, schedule };
});
const extra = Object.keys(src.TG).filter(dn => !order.includes(dn));
if (extra.length) throw new Error('ครูใหม่ที่ไม่มีในระบบ: ' + extra.join(','));
fs.writeFileSync(path.join(__dirname,'teachers.json'), JSON.stringify(result, null, 2), 'utf8');
// ฝังใน index.html แทนบล็อก TEACHERS_DATA เดิม
const htmlPath = path.join(__dirname,'index.html');
let html = fs.readFileSync(htmlPath,'utf8');
const start = html.indexOf('const TEACHERS_DATA = ['); const end = html.indexOf('\n];', start) + 3;
if (start < 0 || end < 3) throw new Error('หาบล็อก TEACHERS_DATA ไม่เจอ');
const body = JSON.stringify(result, null, 2).split('\n').map((l,i)=> i===0 ? l : l).join('\n');
html = html.slice(0,start) + 'const TEACHERS_DATA = ' + body + ';' + html.slice(end + (html[end]===';'?1:0));
html = html.split('ภาคเรียนที่ 1/2569').join('ภาคเรียนที่ 2/2569');
fs.writeFileSync(htmlPath, html, 'utf8');
let n = 0; result.forEach(t => DAYS.forEach(d => n += t.schedule[d].length));
console.log('ครู', result.length, 'คน · คาบ', n);
