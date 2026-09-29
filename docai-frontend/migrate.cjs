const fs = require('fs');
const files = [
  'd:/docai/docai-frontend/src/pages/Register.tsx',
  'd:/docai/docai-frontend/src/pages/NotFound.tsx',
  'd:/docai/docai-frontend/src/pages/Login.tsx',
  'd:/docai/docai-frontend/src/pages/Landing.tsx',
  'd:/docai/docai-frontend/src/pages/DocumentViewer.tsx',
  'd:/docai/docai-frontend/src/pages/Dashboard.tsx',
  'd:/docai/docai-frontend/src/pages/Chat.tsx',
  'd:/docai/docai-frontend/src/components/ProtectedRoute.tsx',
  'd:/docai/docai-frontend/src/components/Sidebar.tsx',
  'd:/docai/docai-frontend/src/components/DocumentRow.tsx',
  'd:/docai/docai-frontend/src/components/layout/AppLayout.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/['"]react-router-dom['"]/g, "'@tanstack/react-router'");
  content = content.replace(/navigate\(['"](.*?)['"]\)/g, "navigate({ to: '$1' })");
  content = content.replace(/navigate\(['"](.*?)['"],\s*\{(.*?)\}\)/g, "navigate({ to: '$1', $2 })");
  content = content.replace(/useParams\(\)/g, "useParams({ strict: false })");
  fs.writeFileSync(file, content);
}
