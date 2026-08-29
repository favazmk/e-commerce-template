const fs = require('fs');
const content = fs.readFileSync('C:/Users/favaz/.gemini/antigravity-ide/brain/9d4dfb80-3ee2-4380-8dee-4ecf4b7785ef/.system_generated/tasks/task-2330.log', 'utf8');
const match = content.match(/BODY: (.*?)<\/html>/s);
if (match) {
    let html = match[1] + '</html>';
    // extract specific errors
    const errorMatch = html.match(/bg-red-[^>]*>(.*?)</);
    if (errorMatch) {
        console.log('ERROR MATCH:', errorMatch[1]);
    } else {
        console.log('NO ERROR FOUND');
        // Let's print the actual text content of the page
        console.log('TEXT:', html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 500));
    }
} else {
    console.log('NO BODY MATCH');
}
