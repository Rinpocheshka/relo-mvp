const fs = require('fs');
const files = ['src/app/components/Announcements.tsx', 'src/app/components/Events.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const \[selectedCity, setSelectedCity\] = useState\('Все'\);/g, "const [selectedCity, setSelectedCity] = useState('Вьетнам');");
  content = content.replace(/if \(selectedCity !== 'Все' && selectedCity !== 'Вьетнам'\)/g, "if (selectedCity !== 'Вьетнам')");
  content = content.replace(/<option value="Все">.*?<\/option>\s*<option value="Дананг, Вьетнам">.*?<\/option>\s*<option value="Вьетнам">.*?<\/option>/ms, `<option value="Вьетнам">🇻🇳 Весь Вьетнам</option>\n                  <option value="Дананг, Вьетнам">🏙️ Дананг</option>`);
  fs.writeFileSync(file, content, 'utf8');
}
console.log('Done');