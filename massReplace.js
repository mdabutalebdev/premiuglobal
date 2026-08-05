const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if(file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const frontendSrc = path.join(__dirname, 'premiuglobal-frontend', 'src');
const files = walkSync(frontendSrc);

let replacedCount = 0;
for (const file of files) {
    if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('Fresh Food Bazar')) {
            content = content.replace(/Fresh Food Bazar/g, 'Premium');
            fs.writeFileSync(file, content);
            console.log(`Replaced in ${file}`);
            replacedCount++;
        }
    }
}
console.log(`Total files modified: ${replacedCount}`);
