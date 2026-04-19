const fs = require('fs');

const files = ['src/app/components/Announcements.tsx', 'src/app/components/Events.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Re-add 'Все' option
  content = content.replace(
    /<option value="Вьетнам">🇻🇳 Весь Вьетнам<\/option>/ms,
    '<option value="Все">🌍 Все локации</option>\n                  <option value="Вьетнам">🇻🇳 Весь Вьетнам</option>'
  );

  // Update logic to ilike whenever "Вьетнам" is picked, but no filter for "Все"
  content = content.replace(
    /if \(selectedCity !== 'Вьетнам'\) \{\s*(?:\/\/.*?\s*)*query = query.eq\('city', selectedCity\);\s*\}/s,
    `if (selectedCity !== 'Все') {\n        if (selectedCity === 'Вьетнам') {\n          query = query.ilike('city', '%Вьетнам%');\n        } else {\n          query = query.eq('city', selectedCity);\n        }\n      }`
  );

  // Revert hook default back to 'Все'
  content = content.replace(
    /useState\('Вьетнам'\)/g,
    `useState('Все')`
  );

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Done script');
