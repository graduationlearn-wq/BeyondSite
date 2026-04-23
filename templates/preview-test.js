const ejs = require('ejs');
const fs = require('fs');

const data = {
  businessName: 'Apex Studio',
  tagline: 'Crafting experiences that endure.',
  about: 'We are a team of dedicated professionals committed to delivering excellence across every project we undertake.',
  products: ['Brand Strategy', 'Web Design', 'Digital Marketing', 'Consulting'],
  tone: 'professional',
  year: 2025
};

const template = fs.readFileSync('./website-template-8.ejs', 'utf8');
const html = ejs.render(template, data);
fs.writeFileSync('./preview-output.html', html);
console.log('Done — open preview-output.html in browser');