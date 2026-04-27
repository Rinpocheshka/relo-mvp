const fs = require('fs');
const f = 'src/app/components/Announcements.tsx';
let c = fs.readFileSync(f,'utf8');
c = c.replace(
  ".select('*', { count: 'exact' });",
  ".select('*', { count: 'exact' })\n        .eq('status', 'active');"
);
fs.writeFileSync(f, c, 'utf8');
console.log(c.includes(".eq('status', 'active')") ? 'done' : 'failed');