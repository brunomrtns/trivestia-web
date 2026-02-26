#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'packages/sim-core/dist');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove "use strict"
  content = content.replace('"use strict";\n', '');
  
  // Converte Object.defineProperty(exports, ...)
  content = content.replace(/Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\n/g, '');
  
  // Converte exports.funcName = funcName;
  content = content.replace(/exports\.(\w+) = (\w+);/g, 'export { $2 as $1 };');
  
  // Converte var module_1 = require("./module");
  content = content.replace(/var (\w+) = require\("(.+?)"\);/g, 'import * as $1 from "$2.js";');
  
  // Converte Object.defineProperty(exports, "name", { enumerable: true, get: function () { return module.name; } });
  content = content.replace(/Object\.defineProperty\(exports, "(\w+)", \{ enumerable: true, get: function \(\) \{ return (\w+)\.(\w+); \} \}\);/g, 'export { $3 as $1 } from "$2.js";');
  
  // Remove linhas vazias extras
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Convertido: ${path.basename(filePath)}`);
}

// Processa todos os arquivos .js
const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));

console.log(`Convertendo ${files.length} arquivos de CommonJS para ESM...\n`);

files.forEach(file => {
  const filePath = path.join(distDir, file);
  convertFile(filePath);
});

console.log('\n✨ Conversão concluída!');
