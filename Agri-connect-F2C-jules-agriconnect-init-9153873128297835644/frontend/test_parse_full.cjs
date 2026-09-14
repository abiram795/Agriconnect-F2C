const fs = require('fs');
const content = fs.readFileSync('src/pages/FarmerDashboard.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
let div_balance = 0;
for (let i = 0; i < lines.length; i++) {
   const line = lines[i];
   balance += (line.match(/\{/g) || []).length;
   balance -= (line.match(/\}/g) || []).length;
   div_balance += (line.match(/<div/g) || []).length;
   div_balance -= (line.match(/<\/div>/g) || []).length;
   console.log(`${i+1}: b=${balance} d=${div_balance} -> ${line.trim()}`);
}
console.log("FINAL:", {balance, div_balance});
