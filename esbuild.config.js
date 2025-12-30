import * as esbuild from 'esbuild';
import { readdir } from 'fs/promises';
import { join } from 'path';

// 获取所有 node_modules 作为 external
async function getNodeModules() {
  try {
    const modules = await readdir('./node_modules');
    return modules.filter(x => x !== '.bin');
  } catch (error) {
    return [];
  }
}

const nodeModules = await getNodeModules();

await esbuild.build({
  entryPoints: ['./src/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: './dist/app.js',
  external: nodeModules,
  sourcemap: false,  // 生产环境不生成 source map
  minify: true,
  treeShaking: true,
  logLevel: 'info',
}).then(() => {
  console.log('✅ Build completed successfully!');
}).catch(() => {
  console.error('❌ Build failed!');
  process.exit(1);
});

