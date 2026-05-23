const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

const SECRET_KEY = 'ForestLawSecret';
const files = [
    '102-Google AI Studio-0521.md',
    '103-Google AI Studio-0521.md',
    '105-Google AI Studio-0521.md',
    '107-Google AI Studio-0521.md',
    '108-Google AI Studio-0521.md',
    '109-Google AI Studio-0521.md',
    '110-Google AI Studio-0521.md',
    '111-Google AI Studio-0521.md',
    '112-Google AI Studio-0521.md',
    '113-Google AI Studio-0521.md',
    '113-2-Google AI Studio-0521.md',
    '115-Google AI Studio-0521.md'
];

const questions = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const sections = content.split('---');
    
    sections.forEach(section => {
        if (!section.trim()) return;
        
        const qMatch = section.match(/\*\*第 \d+ 題\*\*\s*([\s\S]*?)\s*\(A\)/);
        const aMatch = section.match(/\(A\)\s*(.*?)\s*\(B\)/);
        const bMatch = section.match(/\(B\)\s*(.*?)\s*\(C\)/);
        const cMatch = section.match(/\(C\)\s*(.*?)\s*\(D\)/);
        const dMatch = section.match(/\(D\)\s*(.*?)\s*(?=>|`|---|$)/s);
        const ansMatch = section.match(/> \*\*✅ 解答：([A-D])\*\*/);
        const expMatch = section.match(/> \*\*💡 專業解析：\*\*\s*([\s\S]*?)\s*(?=`|---|$)/);
        const metaMatch = section.match(/`#(.*?)年`\s*`#題號_(.*?)`\s*`#(.*?)`/);

        if (qMatch && ansMatch) {
            let explanation = expMatch ? expMatch[1].trim() : '';
            // Remove the leading '> ' from each line in explanation
            explanation = explanation.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n').trim();

            questions.push({
                question: qMatch[1].trim(),
                A: aMatch ? aMatch[1].trim() : '',
                B: bMatch ? bMatch[1].trim() : '',
                C: cMatch ? cMatch[1].trim() : '',
                D: dMatch ? dMatch[1].trim().split('\n')[0].trim() : '',
                answer: ansMatch[1],
                explanation: explanation,
                year: metaMatch ? metaMatch[1] : '',
                category: metaMatch ? metaMatch[3] : '一般'
            });
        }
    });
});

console.log(`Parsed ${questions.length} questions.`);

const encrypted = CryptoJS.AES.encrypt(JSON.stringify(questions), SECRET_KEY).toString();
fs.writeFileSync('forest-exam-app/public/questions.enc', encrypted);
console.log('Saved to forest-exam-app/public/questions.enc');
