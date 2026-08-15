// CRC-16 reference test vectors.
// "123456789" check values from CRC-RevEng / catalogue.html
//   crc.unirep.org/crcs.html and crccalc.com
import { crc16ibm, crc16modbus, crc16xmodem, crc16ccitt, crc16ccitt1d0f, toHex } from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { console.log(`ok ${name} → ${got}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${got}\n    want ${want}`); fail++; }
}

// "123456789" — canonical check values from the CRC catalogue
check('CRC-16/IBM("123456789")',          toHex(crc16ibm('123456789')),         'bb3d');
check('CRC-16/MODBUS("123456789")',       toHex(crc16modbus('123456789')),      '4b37');
check('CRC-16/XMODEM("123456789")',       toHex(crc16xmodem('123456789')),      '31c3');
check('CRC-16/CCITT-FALSE("123456789")',  toHex(crc16ccitt('123456789')),       '29b1');
check('CRC-16/CCITT-1D0F("123456789")',   toHex(crc16ccitt1d0f('123456789')),   'e5cc');

// Empty input — by spec, each returns its init value (XMODEM = 0; CCITT-FFFF = 0xFFFF; MODBUS = 0xFFFF)
check('CRC-16/IBM("")',          toHex(crc16ibm('')),         '0000');
check('CRC-16/MODBUS("")',       toHex(crc16modbus('')),      'ffff');
check('CRC-16/XMODEM("")',       toHex(crc16xmodem('')),      '0000');
check('CRC-16/CCITT-FALSE("")',  toHex(crc16ccitt('')),       'ffff');
check('CRC-16/CCITT-1D0F("")',   toHex(crc16ccitt1d0f('')),   '1d0f');

// Different inputs produce different outputs
{
  const a = crc16ccitt('abc');
  const b = crc16ccitt('abd');
  check('CRC-16/CCITT differs for distinct inputs', a !== b, true);
}

// Uint8Array input path
{
  const bytes = new TextEncoder().encode('123456789');
  check('CRC-16/IBM(Uint8Array)', toHex(crc16ibm(bytes)), 'bb3d');
}

// Output is uint16
{
  const v = crc16modbus('hello');
  check('output is 16-bit unsigned', Number.isInteger(v) && v >= 0 && v <= 0xffff, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
