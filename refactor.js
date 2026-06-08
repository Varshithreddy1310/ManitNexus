const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'client', 'src'));

let modifiedCount = 0;

const glowRegex = /<div className="bg-glow-container">[\s\S]*?<\/div>\s*<\/div>/g;
// Wait, the regex needs to accurately capture the inner divs. 
// <div className="bg-glow-container">\s*<div className="bg-glow-1"><\/div>\s*<div className="bg-glow-2"><\/div>\s*<\/div>
const exactGlowRegex = /<div className="bg-glow-container">\s*<div className="bg-glow-1"><\/div>\s*<div className="bg-glow-2"><\/div>\s*<\/div>/g;

files.forEach(file => {
  if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/glass-card/g, 'ui-card');
    content = content.replace(/--bg-glass-hover/g, '--bg-surface-hover');
    content = content.replace(/--bg-glass/g, '--bg-surface');
    content = content.replace(/--border-glass-focused/g, '--border-focused');
    content = content.replace(/--border-glass/g, '--border-default');
    
    content = content.replace(exactGlowRegex, '');

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Modified:', file);
      modifiedCount++;
    }
  }
});

console.log('Total files modified:', modifiedCount);
