// อ่าน base64 string จากไฟล์ tileset_b64.txt แล้วสร้าง JS module
const fs = require('fs');
const b64 = fs.readFileSync('./tileset_b64.txt', 'utf8').trim();
const output = `// Auto-generated tileset base64 - do not edit manually
export const TILESET_B64 = 'data:image/jpeg;base64,${b64}';
`;
fs.writeFileSync('./tilesetData.js', output);
console.log('tilesetData.js written, size:', output.length);
