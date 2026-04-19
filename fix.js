const fs = require('fs');
const path = 'src/app/components/Events.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `      if (selectedCity !== 'Все') {
        query = query.eq('city', selectedCity);
      }`;

const valReplace = `      if (selectedCity !== 'Все' && selectedCity !== 'Вьетнам') {
        query = query.eq('city', selectedCity);
      }`;

content = content.replace(targetStr, valReplace);

if (content.includes("&& selectedCity !== 'Вьетнам'")) {
    fs.writeFileSync(path, content, 'utf8');
    console.log("Success");
} else {
    console.error("Replacement failed.");
}
