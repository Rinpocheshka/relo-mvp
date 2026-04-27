const fs = require('fs');
const f = 'src/app/routes.ts';
let c = fs.readFileSync(f,'utf8');
c = c.replace(
  "      { path: '*', lazy: () => import('./components/NotFound').then(m => ({ Component: m.NotFound })) },",
  "      { path: 'admin/moderation', lazy: () => import('./components/AnnouncementModerationPage').then(m => ({ Component: m.AnnouncementModerationPage })) },\n      { path: '*', lazy: () => import('./components/NotFound').then(m => ({ Component: m.NotFound })) },"
);
fs.writeFileSync(f, c, 'utf8');
console.log(c.includes('admin/moderation') ? 'done' : 'failed');