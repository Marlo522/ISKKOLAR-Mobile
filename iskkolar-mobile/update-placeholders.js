const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;

      // Replace existing placeholderTextColor="..." or placeholderTextColor='...'
      content = content.replace(/placeholderTextColor=(['"]).*?\1/g, 'placeholderTextColor="#888"');

      // Inject placeholderTextColor="#888" to any <TextInput missing it
      let parts = content.split('<TextInput');
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          if (!parts[i].includes('placeholderTextColor')) {
            parts[i] = ' placeholderTextColor="#888"' + parts[i];
          }
        }
        content = parts.join('<TextInput');
      }

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
      }
    }
  });
}

processDir('d:/chilly iskkolar mobile/ISKKOLAR-Mobile/iskkolar-mobile/src/screens');
processDir('d:/chilly iskkolar mobile/ISKKOLAR-Mobile/iskkolar-mobile/src/components');
