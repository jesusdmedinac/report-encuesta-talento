import fs from 'fs';
import path from 'path';

function countCheckboxes(md, { excludeOptional = true } = {}) {
  const lines = md.split(/\r?\n/);
  let total = 0;
  let done = 0;
  for (const line of lines) {
    const m = line.match(/^\s*-\s*\[( |x|X)\]/);
    if (!m) continue;
    if (excludeOptional && /(opcional)/i.test(line)) continue;
    total += 1;
    if (/[xX]/.test(m[1])) done += 1;
  }
  return { total, done };
}

function updateProgressBlock(md, percent, done, total) {
  const start = '<!-- progress:start -->';
  const end = '<!-- progress:end -->';
  const line = `Progreso: ${percent}% (completadas ${done} de ${total})`;
  if (md.includes(start) && md.includes(end)) {
    return md.replace(new RegExp(`${start}[\s\S]*?${end}`), `${start}\n${line}\n${end}`);
  }
  // Insert after first heading or at top
  const idx = md.indexOf('\n');
  const headerEnd = idx >= 0 ? idx + 1 : 0;
  const prefix = md.slice(0, headerEnd);
  const suffix = md.slice(headerEnd);
  return `${prefix}${start}\n${line}\n${end}\n\n${suffix}`;
}

function main() {
  const file = path.join(process.cwd(), 'PROGRESS.md');
  const md = fs.readFileSync(file, 'utf8');
  const { total, done } = countCheckboxes(md, { excludeOptional: true });
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const updated = updateProgressBlock(md, percent, done, total);
  fs.writeFileSync(file, updated, 'utf8');
  console.log(`Updated progress: ${percent}% (${done}/${total})`);
}

main();

