const fs = require('fs');
const f = 'src/app/components/CreateAnnouncementModal.tsx';
let c = fs.readFileSync(f,'utf8');
// Add isPending state after success state
c = c.replace(
  "  const [success, setSuccess] = useState(false);",
  "  const [success, setSuccess] = useState(false);\n  const [isPending, setIsPending] = useState(false);"
);
// Reset isPending on close
c = c.replace(
  "  const handleClose = () => {",
  "  const handleClose = () => {\n    setIsPending(false);"
);
fs.writeFileSync(f, c, 'utf8');
console.log('done');