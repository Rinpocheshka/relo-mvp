const fs = require('fs');
const f = 'src/app/components/AnnouncementModerationPage.tsx';
let c = fs.readFileSync(f,'utf8');
c = c.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/app/components/ui/button';");
fs.writeFileSync(f, c, 'utf8');
console.log('done');