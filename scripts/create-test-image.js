const fs = require('fs');
const buf = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", 'base64');
fs.writeFileSync('tests/e2e/test-image.png', buf);
console.log('Image created');
