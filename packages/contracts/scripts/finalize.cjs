/*
 * Проставляет вложенные package.json с полем type в подпапках сборки.
 *
 * Node определяет CJS/ESM по ближайшему package.json. Корневой пакет —
 * commonjs (нет "type"), поэтому dist/esm/*.js без маркера Node счёл бы CJS
 * и упал бы на import/export. Маркеры фиксируют режим каждой подпапки.
 * Скрипт на Node — кроссплатформенно (Windows-разработка, Linux-сборка).
 */
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
fs.writeFileSync(path.join(dist, 'cjs', 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n');
fs.writeFileSync(path.join(dist, 'esm', 'package.json'), JSON.stringify({ type: 'module' }) + '\n');
console.log('✓ dist/cjs и dist/esm помечены type');
