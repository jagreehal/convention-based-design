// Proof that the docs half of the convention aggregates as easily as the
// schema half: glob every repo's docs/, read the agreed frontmatter, index it.
// In real life this is an Astro content loader over cloned repos.
import { globSync, readFileSync } from 'node:fs';

const docs = globSync('*/docs/*.md').map((file) => {
  const [, frontmatter] = readFileSync(file, 'utf8').split('---\n');
  const field = (name) => frontmatter.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1] ?? '';
  return { title: field('title'), repo: field('repo'), owner: field('owner'), file };
});

console.log(`docs index: ${docs.length} doc(s) across ${new Set(docs.map((d) => d.repo)).size} repo(s)`);
for (const doc of docs) console.log(`  ${doc.repo}: "${doc.title}" (${doc.owner}) — ${doc.file}`);
