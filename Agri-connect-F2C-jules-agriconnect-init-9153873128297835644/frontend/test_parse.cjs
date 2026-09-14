const fs = require('fs');
const content = fs.readFileSync('src/pages/FarmerDashboard.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 200; i < lines.length; i++) {
   const line = lines[i];
   balance += (line.match(/<div/g) || []).length;
   balance -= (line.match(/<\/div>/g) || []).length;
   console.log(`${i+1}: ${balance} -> ${line.trim()}`);
}
