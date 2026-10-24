import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = join(root, 'web');
const showroomRoot = join(root, 'showrooms');
const outputRoot = join(root, 'dist');
const stringFields = ['id', 'title', 'subtitle', 'areaLabel', 'layoutLabel', 'location', 'description', 'sourceSummary'];
const allowedFields = new Set([...stringFields, 'assumptions', 'sources', 'startRoom']);

function validateMetadata(metadata, slug) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(`${slug}: metadata.json 必须是对象`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || metadata.id !== slug) {
    throw new Error(`${slug}: id 必须与目录名一致，并使用小写字母、数字及连字符`);
  }
  for (const key of Object.keys(metadata)) {
    if (!allowedFields.has(key)) throw new Error(`${slug}: 未识别的公开元数据字段 ${key}`);
  }
  for (const field of stringFields) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
      throw new Error(`${slug}: ${field} 必须是非空字符串`);
    }
  }
  if (!Array.isArray(metadata.assumptions) || !metadata.assumptions.every(item => typeof item === 'string')) {
    throw new Error(`${slug}: assumptions 必须是字符串数组`);
  }
  if (!Array.isArray(metadata.sources) || !metadata.sources.every(source => {
    if (!source || typeof source.label !== 'string' || !source.label.trim() || typeof source.url !== 'string') return false;
    if (Object.keys(source).some(key => !['label', 'url'].includes(key))) return false;
    try { return ['https:', 'http:'].includes(new URL(source.url).protocol); } catch { return false; }
  })) {
    throw new Error(`${slug}: sources 必须包含 label 与公开 HTTP(S) url`);
  }
  if (metadata.startRoom !== undefined && typeof metadata.startRoom !== 'string') {
    throw new Error(`${slug}: startRoom 必须是字符串`);
  }
  if (/\/Users\/|\/home\/|file:\/\/|[A-Z]:\\/i.test(JSON.stringify(metadata))) {
    throw new Error(`${slug}: 公开元数据不得包含本地路径`);
  }
}

const directories = (await readdir(showroomRoot, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
  .sort((a, b) => a.name.localeCompare(b.name));
const showrooms = [];
for (const directory of directories) {
  const slug = directory.name;
  const sourceRoot = join(showroomRoot, slug);
  const metadata = JSON.parse(await readFile(join(sourceRoot, 'metadata.json'), 'utf8'));
  validateMetadata(metadata, slug);
  if (!(await stat(join(sourceRoot, 'model.js'))).isFile()) throw new Error(`${slug}: 缺少 model.js`);
  showrooms.push({ slug, sourceRoot, metadata });
}
if (!showrooms.length) throw new Error('showrooms/ 下没有可构建的案例');
const revision = createHash('sha256');
for (const name of ['app.js', 'style.css', 'collision.js']) revision.update(await readFile(join(webRoot, name)));
for (const entry of showrooms) {
  revision.update(JSON.stringify(entry.metadata));
  revision.update(await readFile(join(entry.sourceRoot, 'model.js')));
}
const buildId = revision.digest('hex').slice(0, 12);

// 只发布 web/ 与每个案例明确列出的两个文件；参考目录不会进入 dist。
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(webRoot, outputRoot, {
  recursive: true,
  filter: source => {
    const parts = relative(webRoot, source).split(sep);
    return parts.every(part => !part.startsWith('.') && !['references', 'private', 'node_modules'].includes(part));
  }
});
for (const { slug, sourceRoot, metadata } of showrooms) {
  const destination = join(outputRoot, 'showrooms', slug);
  await mkdir(destination, { recursive: true });
  await cp(join(sourceRoot, 'model.js'), join(destination, 'model.js'));
  await writeFile(join(destination, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
}
await writeFile(join(outputRoot, 'showrooms.json'), `${JSON.stringify(showrooms.map(item => item.metadata), null, 2)}\n`);
const app = await readFile(join(outputRoot, 'app.js'), 'utf8');
await writeFile(join(outputRoot, 'app.js'), app.replaceAll('__SHOWROOM_BUILD__', buildId));
const html = await readFile(join(outputRoot, 'index.html'), 'utf8');
await writeFile(join(outputRoot, 'index.html'), html.replace('href="./style.css"', `href="./style.css?v=${buildId}"`).replace('src="./app.js"', `src="./app.js?v=${buildId}"`));
console.log(`已构建 ${showrooms.length} 个样板间 → dist/`);
