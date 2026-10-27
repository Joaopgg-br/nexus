// Apply committed launcher assets after `cap add android` or when updating the logo.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, 'android/app/src/main/res');
if (!fs.existsSync(destination)) {
  console.error('Crie a plataforma primeiro: npx cap add android');
  process.exit(1);
}
fs.cpSync(path.join(root, 'resources/android'), destination, { recursive: true });
const adaptive = path.join(destination, 'mipmap-anydpi-v26');
fs.mkdirSync(adaptive, { recursive: true });
for (const file of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  fs.writeFileSync(path.join(adaptive, file), '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/nexus_icon_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>\n');
}
fs.writeFileSync(path.join(destination, 'values/nexus_brand.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="nexus_icon_background">#081225</color></resources>\n');
console.log('Ícone Nexus aplicado ao Android (legado e adaptativo).');
