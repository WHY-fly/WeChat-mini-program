const QRCode = require('qrcode');
const path = require('path');

const outputDir = path.join(__dirname, 'test-qrcodes');

const codes = [
  { file: 'resident-001.png', data: 'WCHG-ID:RESIDENT-001' },
  { file: 'resident-002.png', data: 'WCHG-ID:RESIDENT-002' },
  { file: 'manager-101.png', data: 'WCHG-ID:MANAGER-101' },
  { file: 'manager-102.png', data: 'WCHG-ID:MANAGER-102' },
  { file: 'doctor-201.png', data: 'WCHG-ID:DOCTOR-201' },
  { file: 'doctor-202.png', data: 'WCHG-ID:DOCTOR-202' },
  { file: 'dispatch-301.png', data: 'WCHG-ID:DISPATCH-301' },
  { file: 'supply-8601.png', data: 'WCHG-SUPPLY:PKG-8601' },
  { file: 'supply-8602.png', data: 'WCHG-SUPPLY:PKG-8602' },
];

async function generate() {
  for (const item of codes) {
    const filePath = path.join(outputDir, item.file);
    await QRCode.toFile(filePath, item.data, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    });
    console.log(`Generated: ${item.file}  ->  ${item.data}`);
  }
  console.log('\nDone! All QR codes saved to test-qrcodes/');
}

generate().catch(console.error);
