// Complete POSIX function list for auditing shim coverage
export const POSIX_FUNCTIONS = {
  // stdio.h
  stdio: ['printf', 'fprintf', 'sprintf', 'snprintf', 'scanf', 'sscanf', 'fscanf',
    'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'fputs', 'fseek', 'ftell', 'rewind',
    'fflush', 'feof', 'ferror', 'clearerr', 'perror', 'remove', 'rename', 'tmpfile', 'tmpnam',
    'putchar', 'getchar', 'puts', 'gets', 'ungetc', 'freopen', 'setbuf', 'setvbuf', 'fileno',
    'popen', 'pclose', 'fdopen', 'fgetc', 'fputc', 'getc', 'putc'],

  // stdlib.h
  stdlib: ['malloc', 'calloc', 'realloc', 'free', 'atoi', 'atol', 'atof',
    'strtol', 'strtoul', 'strtoll', 'strtoull', 'strtod', 'strtof',
    'rand', 'srand', 'exit', 'abort', 'atexit', 'system', 'getenv', 'setenv', 'unsetenv',
    'abs', 'labs', 'llabs', 'div', 'ldiv', 'lldiv', 'qsort', 'bsearch',
    'mkstemp', 'mkdtemp', 'realpath'],

  // string.h
  string: ['strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strlen',
    'strchr', 'strrchr', 'strstr', 'strtok', 'strtok_r', 'strpbrk', 'strspn', 'strcspn',
    'memcpy', 'memmove', 'memset', 'memcmp', 'memchr', 'strdup', 'strndup', 'strerror',
    'strsignal'],

  // math.h
  math: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'exp', 'exp2', 'log', 'log2', 'log10', 'pow', 'sqrt', 'cbrt',
    'ceil', 'floor', 'round', 'trunc', 'fmod', 'remainder',
    'fabs', 'fmin', 'fmax', 'fdim', 'hypot',
    'isnan', 'isinf', 'isfinite', 'isnormal', 'signbit', 'copysign',
    'erf', 'erfc', 'tgamma', 'lgamma',
    'frexp', 'ldexp', 'modf', 'scalbn', 'nearbyint', 'rint',
    'sinf', 'cosf', 'tanf', 'sqrtf', 'fabsf', 'floorf', 'ceilf', 'roundf',
    'fmaf', 'fma'],

  // unistd.h
  unistd: ['read', 'write', 'close', 'lseek', 'dup', 'dup2', 'pipe',
    'fork', 'exec', 'execv', 'execvp', 'execve', 'execl', 'execlp', '_exit',
    'getpid', 'getppid', 'getuid', 'geteuid', 'getgid', 'getegid',
    'getcwd', 'chdir', 'chown', 'unlink', 'rmdir', 'link', 'symlink', 'readlink',
    'access', 'sleep', 'usleep', 'alarm', 'pause',
    'isatty', 'ttyname', 'sysconf', 'pathconf', 'fpathconf',
    'getopt', 'optarg', 'optind'],

  // signal.h
  signal: ['signal', 'raise', 'sigaction', 'sigemptyset', 'sigfillset', 'sigaddset', 'sigdelset',
    'sigismember', 'sigprocmask', 'sigpending', 'sigsuspend', 'kill', 'killpg'],

  // dirent.h
  dirent: ['opendir', 'readdir', 'closedir', 'rewinddir', 'seekdir', 'telldir', 'scandir'],

  // sys/stat.h
  stat: ['stat', 'fstat', 'lstat', 'chmod', 'fchmod', 'umask', 'mkdir'],

  // fcntl.h
  fcntl: ['open', 'creat', 'fcntl'],

  // sys/socket.h
  socket: ['socket', 'bind', 'listen', 'accept', 'connect', 'send', 'recv',
    'sendto', 'recvfrom', 'shutdown', 'setsockopt', 'getsockopt',
    'getpeername', 'getsockname'],

  // netdb.h
  netdb: ['getaddrinfo', 'freeaddrinfo', 'gai_strerror', 'gethostbyname', 'gethostbyaddr',
    'getservbyname', 'getservbyport'],

  // time.h
  time: ['time', 'clock', 'difftime', 'mktime', 'strftime', 'localtime', 'gmtime',
    'asctime', 'ctime', 'clock_gettime', 'clock_getres', 'nanosleep',
    'gettimeofday', 'settimeofday'],

  // pthread.h
  pthread: ['pthread_create', 'pthread_join', 'pthread_detach', 'pthread_exit',
    'pthread_mutex_init', 'pthread_mutex_destroy', 'pthread_mutex_lock', 'pthread_mutex_unlock',
    'pthread_mutex_trylock',
    // POSIX.1-2017 §3 timed-wait primitives
    'pthread_mutex_timedlock', 'pthread_cond_timedwait',
    'pthread_cond_init', 'pthread_cond_destroy',
    'pthread_cond_wait', 'pthread_cond_signal', 'pthread_cond_broadcast',
    'pthread_rwlock_init', 'pthread_rwlock_destroy',
    'pthread_rwlock_rdlock', 'pthread_rwlock_wrlock', 'pthread_rwlock_unlock',
    'pthread_rwlock_tryrdlock', 'pthread_rwlock_trywrlock',
    'pthread_rwlock_timedrdlock', 'pthread_rwlock_timedwrlock',
    'pthread_barrier_init', 'pthread_barrier_destroy', 'pthread_barrier_wait',
    'pthread_spin_init', 'pthread_spin_destroy',
    'pthread_spin_lock', 'pthread_spin_unlock', 'pthread_spin_trylock',
    'pthread_key_create', 'pthread_setspecific', 'pthread_getspecific',
    'pthread_once', 'pthread_self', 'pthread_equal',
    // POSIX.1-2017 §3 + §2.9.5 thread cancellation
    'pthread_cancel', 'pthread_setcancelstate', 'pthread_setcanceltype',
    'pthread_testcancel',
    // POSIX.1-2017 §3 [signal.h] per-thread signal handling
    'pthread_kill', 'pthread_sigmask',
    // POSIX.1-2017 §3 thread attribute objects
    'pthread_attr_init', 'pthread_attr_destroy',
    'pthread_attr_getstacksize', 'pthread_attr_setstacksize',
    'pthread_attr_getdetachstate', 'pthread_attr_setdetachstate',
    'pthread_attr_getguardsize', 'pthread_attr_setguardsize',
    'pthread_attr_getschedpolicy', 'pthread_attr_setschedpolicy',
    'pthread_attr_getschedparam', 'pthread_attr_setschedparam',
    'pthread_attr_getinheritsched', 'pthread_attr_setinheritsched',
    'pthread_attr_getscope', 'pthread_attr_setscope',
    // POSIX.1-2017 §3 pthread_atfork + per-thread scheduling
    'pthread_atfork',
    'pthread_setschedparam', 'pthread_getschedparam', 'pthread_setschedprio',
    // glibc/musl (non-POSIX) pthread_yield + thread-name extensions
    'pthread_yield', 'pthread_setname_np', 'pthread_getname_np'],

  // sched.h — POSIX.1-2017 §3 [sched.h] process/thread scheduling.
  // Only sched_yield is shimmed; the param/policy getters/setters are
  // catalogued separately under pthread (pthread_setschedparam etc.)
  // since they are the per-thread API surface the matrix exercises.
  sched: ['sched_yield'],

  // dlfcn.h
  dlfcn: ['dlopen', 'dlsym', 'dlclose', 'dlerror'],

  // sys/mman.h — POSIX.1-2017 §3
  mman: ['mmap', 'munmap', 'mprotect', 'msync', 'madvise', 'posix_madvise',
    'mlock', 'munlock', 'mlockall', 'munlockall'],

  // termios.h
  termios: ['tcgetattr', 'tcsetattr', 'cfgetispeed', 'cfsetispeed', 'cfgetospeed', 'cfsetospeed',
    'tcdrain', 'tcflush', 'tcsendbreak'],

  // sys/wait.h
  wait: ['wait', 'waitpid', 'waitid'],

  // sys/select.h + poll.h
  select: ['select', 'pselect', 'poll', 'ppoll'],

  // sys/epoll.h
  epoll: ['epoll_create', 'epoll_create1', 'epoll_ctl', 'epoll_wait'],

  // semaphore.h — POSIX.1-2017 §3 unnamed/named semaphores
  semaphore: ['sem_init', 'sem_destroy', 'sem_wait', 'sem_post', 'sem_trywait',
    'sem_timedwait', 'sem_getvalue',
    'sem_open', 'sem_close', 'sem_unlink'],
};

// Function to audit current shim coverage
export function auditShimCoverage(shimSource: string): { covered: string[], missing: string[] } {
  const covered: string[] = [];
  const missing: string[] = [];

  for (const [category, funcs] of Object.entries(POSIX_FUNCTIONS)) {
    for (const fn of funcs) {
      // Check if function is defined in the shim source
      const pattern = new RegExp(`function\\s+_?${fn}\\b|\\b${fn}\\s*[=(]`);
      if (pattern.test(shimSource)) {
        covered.push(`${category}::${fn}`);
      } else {
        missing.push(`${category}::${fn}`);
      }
    }
  }

  return { covered, missing };
}
