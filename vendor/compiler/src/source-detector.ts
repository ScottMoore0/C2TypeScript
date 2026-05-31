import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Scan a directory of source files and return detected features
export interface DetectedFeatures {
  usesSetjmp: boolean;
  usesCUDA: boolean;
  usesOpenCL: boolean;
  usesFPGA: boolean;
  usesAudioCallback: boolean;
  usesAtomicOrdering: boolean;
  usesMmapExec: boolean;
  usesFunctionPointerCast: boolean;
  usesDeviceFiles: boolean;
  usesFlexBison: boolean;
  usesProtobuf: boolean;
  usesQtMoc: boolean;
  usesConfigureAc: boolean;
  usesLongDouble: boolean;
  deviceTypes: string[];  // 'spi', 'i2c', 'serial', 'video'
  generatedSources: string[];  // paths to .l, .y, .proto files
  platform: string;  // detected from #ifdef patterns
}

export function detectFeatures(projectDir: string): DetectedFeatures {
  const features: DetectedFeatures = {
    usesSetjmp: false,
    usesCUDA: false,
    usesOpenCL: false,
    usesFPGA: false,
    usesAudioCallback: false,
    usesAtomicOrdering: false,
    usesMmapExec: false,
    usesFunctionPointerCast: false,
    usesDeviceFiles: false,
    usesFlexBison: false,
    usesProtobuf: false,
    usesQtMoc: false,
    usesConfigureAc: false,
    usesLongDouble: false,
    deviceTypes: [],
    generatedSources: [],
    platform: 'generic',
  };

  scanDirectory(projectDir, features);
  return features;
}

function scanDirectory(dir: string, features: DetectedFeatures): void {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return; }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'build', 'dist'].includes(entry)) {
        scanDirectory(fullPath, features);
      }
      continue;
    }

    // Check file extensions for generators
    if (entry.endsWith('.l') || entry.endsWith('.y') || entry.endsWith('.lex') || entry.endsWith('.yacc')) {
      features.usesFlexBison = true;
      features.generatedSources.push(fullPath);
    }
    if (entry.endsWith('.proto')) {
      features.usesProtobuf = true;
      features.generatedSources.push(fullPath);
    }
    if (entry === 'configure.ac' || entry === 'configure.in') {
      features.usesConfigureAc = true;
    }

    // Only scan C/C++/CUDA source files for content patterns
    if (!/\.(c|cpp|cc|cxx|h|hpp|hxx|cu|cl)$/.test(entry)) continue;

    let content: string;
    try { content = readFileSync(fullPath, 'utf-8'); } catch { continue; }

    // setjmp/longjmp (incl. POSIX sigsetjmp/siglongjmp — same lowering)
    if (/\bsetjmp\b|\blongjmp\b|\bsigsetjmp\b|\bsiglongjmp\b/.test(content)) features.usesSetjmp = true;

    // CUDA
    if (/\b__global__\b|\bcudaMalloc\b|\bcudaMemcpy\b|<<<.*>>>/.test(content)) features.usesCUDA = true;

    // OpenCL
    if (/\bclCreateKernel\b|\bclEnqueueNDRangeKernel\b|\bCL_MEM_READ_WRITE\b/.test(content)) features.usesOpenCL = true;

    // FPGA host APIs
    if (/\bxrt::\b|\bxilinx\b|\bintel::fpga\b/i.test(content)) features.usesFPGA = true;

    // Audio callbacks (PortAudio, ALSA, CoreAudio, PulseAudio)
    if (/\bPa_OpenStream\b|\bsnd_pcm_writei\b|\bAudioUnitRender\b|\bpa_simple_write\b|\bPaStreamCallback\b/.test(content)) {
      features.usesAudioCallback = true;
    }

    // Atomic with explicit memory ordering
    if (/memory_order_relaxed|memory_order_acquire|memory_order_release|memory_order_acq_rel|memory_order_seq_cst/.test(content)) {
      features.usesAtomicOrdering = true;
    }

    // JIT: mmap with PROT_EXEC or VirtualAlloc with PAGE_EXECUTE
    if (/PROT_EXEC|PAGE_EXECUTE/.test(content)) features.usesMmapExec = true;

    // Function pointer cast from buffer (JIT pattern)
    if (/\(\s*\(\s*\w+\s*\(\s*\*\s*\)\s*\(/.test(content) && /mmap|VirtualAlloc|malloc/.test(content)) {
      features.usesFunctionPointerCast = true;
    }

    // Device files
    if (/\/dev\/spi/.test(content)) { features.usesDeviceFiles = true; features.deviceTypes.push('spi'); }
    if (/\/dev\/i2c/.test(content)) { features.usesDeviceFiles = true; features.deviceTypes.push('i2c'); }
    if (/\/dev\/tty(USB|ACM|S)/.test(content)) { features.usesDeviceFiles = true; features.deviceTypes.push('serial'); }
    if (/\/dev\/video/.test(content)) { features.usesDeviceFiles = true; features.deviceTypes.push('video'); }

    // Qt moc
    if (/Q_OBJECT|Q_PROPERTY|Q_INVOKABLE/.test(content)) features.usesQtMoc = true;

    // Long double
    if (/\blong\s+double\b/.test(content)) features.usesLongDouble = true;

    // Platform detection from #ifdef
    if (/#ifdef\s+_WIN32|#ifdef\s+WIN32/.test(content)) features.platform = 'windows';
    else if (/#ifdef\s+__linux__|#ifdef\s+__ANDROID__/.test(content)) features.platform = 'linux';
    else if (/#ifdef\s+__APPLE__/.test(content)) features.platform = 'darwin';
  }

  // Deduplicate device types
  features.deviceTypes = [...new Set(features.deviceTypes)];
}

// Dependency source availability check
export function checkSourceAvailability(libName: string, projectDir: string): 'in-project' | 'system' | 'downloadable' | 'closed-source' | 'not-found' {
  // Check in-project: vendor/, third_party/, external/, deps/, lib/
  for (const subdir of ['vendor', 'third_party', 'external', 'deps', 'lib', 'contrib']) {
    const libDir = join(projectDir, subdir, libName);
    if (existsSync(libDir)) return 'in-project';
  }

  // Check system source (common locations)
  const systemPaths = ['/usr/src', '/usr/local/src', '/usr/include'];
  for (const sp of systemPaths) {
    if (existsSync(join(sp, libName))) return 'system';
  }

  // Check if it's in our known open-source index (will be populated later)
  // For now, check common names
  const knownOpenSource = ['zlib', 'libpng', 'libjpeg', 'sqlite', 'lua', 'openssl', 'curl', 'expat', 'bzip2', 'lz4', 'zstd', 'pcre', 'pcre2', 'jansson', 'cjson', 'yaml', 'tinyxml2', 'miniz', 'stb', 'freetype', 'harfbuzz', 'icu'];
  if (knownOpenSource.includes(libName.toLowerCase())) return 'downloadable';

  return 'not-found';
}

// Scan for unresolved includes
export function findUnresolvedIncludes(translatedFiles: string[], shimmedHeaders: Set<string>): string[] {
  const unresolved: string[] = [];
  // This would scan AST dump output for included headers not in our shim set
  // For now, return empty - will be populated during translation
  return unresolved;
}

// Detect platform from #ifdef patterns and set Clang target
export function detectTargetPlatform(projectDir: string): string {
  const features = detectFeatures(projectDir);
  switch (features.platform) {
    case 'windows': return 'x86_64-pc-windows-msvc';
    case 'linux': return 'x86_64-unknown-linux-gnu';
    case 'darwin': return 'x86_64-apple-darwin';
    default: return 'x86_64-unknown-linux-gnu'; // default to Linux
  }
}
