// Artifact-first EventCatalog generator: reads each repo's committed
// contracts/events/*.json — never its source code. Any language that commits
// conformant artifacts (with x-eventcatalog metadata) shows up in the catalog.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import utils from '@eventcatalog/sdk';

export default async (_, { repos, domain }) => {
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  const { writeEvent, addSchemaToEvent, writeService, writeDomain } = utils(projectDir);

  const servicePath = (id) => join('../', 'domains', domain.id, 'services', id);
  const services = new Map();
  const service = (id) => {
    if (!services.has(id)) services.set(id, { sends: [], receives: [] });
    return services.get(id);
  };

  for (const repo of repos) {
    const dir = join(projectDir, repo, 'contracts', 'events');
    for (const file of readdirSync(dir)) {
      const schema = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      const meta = schema['x-eventcatalog'] ?? {};
      const id = meta.id ?? file.replace(/\.json$/, '');
      const version = meta.version ?? '1.0.0';
      const producer = (meta.producers ?? [])[0];

      await writeEvent(
        {
          id,
          name: meta.name ?? id,
          version,
          summary: meta.summary ?? '',
          markdown: `Generated from \`${repo}/contracts/events/${file}\`.\n\n<SchemaViewer file="schema.json" title="Schema" maxHeight="500" />`,
          schemaPath: 'schema.json',
        },
        { path: producer ? join(servicePath(producer), 'events', id) : id, override: true }
      );
      await addSchemaToEvent(id, { fileName: 'schema.json', schema: JSON.stringify(schema, null, 2) }, version);

      for (const s of meta.producers ?? []) service(s).sends.push({ id, version });
      for (const s of meta.consumers ?? []) service(s).receives.push({ id, version });
      console.log(`documented ${id} (v${version}) from ${repo}`);
    }
  }

  for (const [id, { sends, receives }] of services) {
    await writeService(
      {
        id,
        name: id,
        version: '1.0.0',
        summary: '',
        markdown: '',
        ...(sends.length > 0 && { sends }),
        ...(receives.length > 0 && { receives }),
      },
      { path: servicePath(id), override: true }
    );
  }

  await writeDomain(
    {
      id: domain.id,
      name: domain.name,
      version: domain.version,
      markdown: '',
      services: [...services.keys()].map((id) => ({ id, version: 'latest' })),
    },
    { override: true }
  );

  console.log(`contracts generator: ${services.size} service(s) from ${repos.length} repo(s)`);
};
