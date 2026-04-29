import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Tạo lại biến __dirname cho môi trường ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const name = 'xantrack';
  const version = '1.0.1';

  // Lấy đường dẫn thư mục cha (thư mục gốc của project)
  const rootDir = path.resolve(__dirname, '../');

  try {
    const stats = await fs.stat(rootDir);
    if (!stats.isDirectory()) {
      console.log('❌ Không tìm thấy root project');
      return;
    }
  } catch (err) {
    console.log('❌ Không tìm thấy root project');
    return;
  }

  const fileName = `${name}_v${version}.txt`;
  // Lưu file txt tại thư mục chứa file script này (thư mục doc)
  const outputPath = path.resolve(__dirname, fileName);

  let buffer = '';

  // Hàm đệ quy tìm các folder có tên chỉ định
  async function findTargetFolders(currentDir: string) {
    const items = await fs.readdir(currentDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        // Chỉ lấy folder tên "src", "app" và "lib" (Vì đây là project Expo của bạn)
        if (item.name === 'src' || item.name === 'app' || item.name === 'lib') {
          console.log(`📂 Tìm thấy thư mục code: ${fullPath}`);
          await readCodeFiles(fullPath);
        } else {
          // Bỏ qua thư mục node_modules, .git, .expo để quét nhanh hơn
          if (item.name !== 'node_modules' && item.name !== '.git' && item.name !== '.expo') {
            await findTargetFolders(fullPath);
          }
        }
      }
    }
  }

  // Hàm đệ quy đọc nội dung file bên trong folder đã tìm thấy
  async function readCodeFiles(targetDir: string) {
    const items = await fs.readdir(targetDir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(targetDir, item.name);

      if (item.isDirectory()) {
        await readCodeFiles(fullPath);
      } else if (
        item.isFile() &&
        (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.dart'))
      ) {
        buffer += `\n========================================\n`;
        buffer += `FILE: ${fullPath}\n`;
        buffer += `========================================\n`;
        const content = await fs.readFile(fullPath, 'utf-8');
        buffer += `${content}\n`;
      }
    }
  }

  // Bắt đầu thực thi quét từ root
  await findTargetFolders(rootDir);

  // Ghi kết quả ra file
  await fs.writeFile(outputPath, buffer, 'utf-8');
  console.log(`\n✅ Export xong! File được lưu tại: ${outputPath}`);
}

main().catch((err) => {
  console.error('❌ Có lỗi xảy ra trong quá trình chạy script:', err);
});