const fs = require('fs');
const f = 'src/app/components/CreateAnnouncementModal.tsx';
let c = fs.readFileSync(f,'utf8');
c = c.replace(
  "const { user, profile } = useAuth();",
  "const { user, profile, isAdmin } = useAuth();"
);
c = c.replace(
  "status: 'active',",
  "status: isAdmin ? 'active' : 'pending',"
);
c = c.replace(
  "setSuccess(true);",
  "setSuccess(true);\n      setIsPending(!isAdmin);"
);
fs.writeFileSync(f, c, 'utf8');
console.log('done');