// Mirage — Browser OS/Environment Emulation Layer
// Virtual filesystem, environment, streams, process, and clock abstractions.

// VFS
export { VirtualFileSystem, VfsError } from "./vfs/vfs.js";
export { type VfsFile, type VfsDirectory, type FileStat, type NodeType } from "./vfs/types.js";
export {
  normalize, join, dirname, basename, extname,
  isAbsolute, resolve, split
} from "./vfs/path.js";

// Environment
export { Environment } from "./env/environment.js";

// Process
export {
  Process, ProcessExitSignal, ProcessTable,
  type ProcessRecord, type ExitReason, type SigInfoWait, type RUsage,
  WIFEXITED, WEXITSTATUS, WIFSIGNALED, WTERMSIG, WIFSTOPPED, WSTOPSIG,
  WIFCONTINUED, WCOREDUMP, W_EXITCODE,
  WNOHANG, WUNTRACED, WCONTINUED,
  P_ALL, P_PID, P_PGID,
  CLD_EXITED, CLD_KILLED, CLD_DUMPED, CLD_TRAPPED, CLD_STOPPED, CLD_CONTINUED,
  reasonToStatus,
} from "./process/process.js";

// I/O
export {
  type Stream, type SeekWhence,
  BufferStream, CaptureStream, FileStream, FileDescriptorTable,
  PipeEnd, makePipe,
  F_DUPFD, F_GETFD, F_SETFD, F_GETFL, F_SETFL, F_DUPFD_CLOEXEC, FD_CLOEXEC
} from "./io/streams.js";

// Clock
export { Clock, type TimeVal, type TimeSpec } from "./clock/clock.js";

// Asset preloading
export { preloadFiles, preloadEntries, preloadFromDisk } from "./vfs/preload.js";

// Signals
export {
  SignalRegistry, type SignalHandler, type Sigaction, type Itimerval,
  SigSet, NSIG,
  SIG_DFL, SIG_IGN,
  SIGHUP, SIGINT, SIGQUIT, SIGILL, SIGTRAP, SIGABRT, SIGBUS,
  SIGFPE, SIGKILL, SIGUSR1, SIGSEGV, SIGUSR2, SIGPIPE,
  SIGALRM, SIGTERM, SIGCHLD, SIGCONT, SIGSTOP, SIGTSTP,
  SA_NOCLDSTOP, SA_NOCLDWAIT, SA_SIGINFO, SA_ONSTACK,
  SA_RESTART, SA_NODEFER, SA_RESETHAND,
  SIG_BLOCK, SIG_UNBLOCK, SIG_SETMASK,
  ITIMER_REAL, ITIMER_VIRTUAL, ITIMER_PROF,
  sigemptyset, sigfillset, sigaddset, sigdelset, sigismember,
  type SigJmpBuf, SigLongjmp, sigsetjmpInit, siglongjmp,
} from "./signal/signal.js";

// Network (L.7 BSD sockets)
export {
  NetworkStack, Socket, type SockAddr, type AddrInfo, type NetResult,
  AF_UNSPEC, AF_UNIX, AF_INET, AF_INET6,
  SOCK_STREAM, SOCK_DGRAM, SOCK_RAW,
  IPPROTO_IP, IPPROTO_TCP, IPPROTO_UDP, SOL_SOCKET,
  SO_DEBUG, SO_REUSEADDR, SO_TYPE, SO_ERROR, SO_DONTROUTE,
  SO_BROADCAST, SO_SNDBUF, SO_RCVBUF, SO_KEEPALIVE,
  SO_OOBINLINE, SO_LINGER, SO_REUSEPORT,
  SHUT_RD, SHUT_WR, SHUT_RDWR,
  MSG_PEEK, MSG_DONTWAIT, MSG_WAITALL,
  ENOTSOCK, EAFNOSUPPORT, EADDRINUSE, EADDRNOTAVAIL,
  ECONNREFUSED, ENOTCONN, EAGAIN, EINVAL, ENOSYS,
  htonl, htons, ntohl, ntohs,
  inet_pton, inet_ntop, getaddrinfo,
} from "./network/network.js";

// Memory mapping
export {
  MmapManager, type MmapRegion, type FdPathResolver, type MmapOptions,
  type AccessKind, MprotectViolation,
  PROT_NONE, PROT_READ, PROT_WRITE, PROT_EXEC,
  MAP_SHARED, MAP_PRIVATE, MAP_FIXED, MAP_ANONYMOUS, MAP_FAILED,
  MS_ASYNC, MS_INVALIDATE, MS_SYNC,
} from "./mmap/mmap.js";

// Top-level event loop (Round 32) — cooperative scheduler for translated C
// programs that mix blocking Atomics.wait bridges (Round 31) with async fd
// readiness (sockets, pipes) and timer/signal delivery.
export {
  EventLoop, type TimerHandle, type FdWatchHandle, type SignalHandle,
  type FdReadinessProbe,
  POLLIN, POLLPRI, POLLOUT, POLLERR, POLLHUP, POLLNVAL,
  POLL_INFINITE, POLL_POLL_ONLY,
  getDefaultEventLoop, _resetDefaultEventLoop,
  pollViaLoop, selectViaLoop, queueLoopJob,
} from "./event-loop/event-loop.js";

// OS facade
export { MirageOS } from "./os.js";

// POSIX <dirent.h> — directory streams (IEEE Std 1003.1-2017).
export {
  type DIR, type Dirent,
  opendirVfs, readdirStream, readdir_r,
  rewinddir, closedir, telldir, seekdir, scandir,
  DT_UNKNOWN, DT_FIFO, DT_CHR, DT_DIR, DT_BLK, DT_REG, DT_LNK, DT_SOCK,
} from "./posix/dirent.js";

// POSIX <sys/stat.h> — struct stat + mode bits (IEEE Std 1003.1-2017).
export {
  type Stat, statVfs, lstatVfs, makeStat,
  S_IFMT, S_IFSOCK, S_IFLNK, S_IFREG, S_IFBLK, S_IFDIR, S_IFCHR, S_IFIFO,
  S_ISUID, S_ISGID, S_ISVTX,
  S_IRWXU, S_IRUSR, S_IWUSR, S_IXUSR,
  S_IRWXG, S_IRGRP, S_IWGRP, S_IXGRP,
  S_IRWXO, S_IROTH, S_IWOTH, S_IXOTH,
  S_ISREG, S_ISDIR, S_ISCHR, S_ISBLK, S_ISFIFO, S_ISLNK, S_ISSOCK,
} from "./posix/stat.js";

// POSIX <unistd.h> + <errno.h> — access flags and common errno values.
// (EINVAL is re-exported from ./network/network.js above.)
export {
  F_OK, R_OK, W_OK, X_OK,
  ENOENT, EBADF, EACCES, EEXIST, ENOTDIR, EISDIR,
  ENAMETOOLONG, ENOTEMPTY, ELOOP,
} from "./posix/fs.js";

// POSIX <dlfcn.h> — registry-backed dynamic library loader (IEEE Std 1003.1-2017).
// BRIDGE: dlfcn-registry — see dlfcn.ts header.
export {
  type DlHandle,
  RTLD_LAZY, RTLD_NOW, RTLD_NOLOAD, RTLD_GLOBAL, RTLD_LOCAL, RTLD_NODELETE,
  RTLD_DEFAULT, RTLD_NEXT,
  register as dlfcn_register, unregister as dlfcn_unregister,
  _reset as _dlfcn_reset,
  dlopen, dlsym, dlclose, dlerror,
  __cpp_register_plugin,
} from "./posix/dlfcn.js";

// POSIX <sys/mman.h> — POSIX-shape memory mapping wrappers (IEEE Std 1003.1-2017 §3).
export {
  type CPtrLike as MmanCPtr, type MmapFdResolver,
  mmap_real, munmap_real, mprotect_real, msync_real, madvise_real,
  getLastErrno as mman_getLastErrno,
  _reset as _mman_reset,
  activeRegionCount as mman_activeRegionCount,
  isMapped as mman_isMapped,
} from "./posix/mman.js";

// POSIX <sys/uio.h> — vectored (scatter/gather) I/O. BRIDGE: posix-uio.
export {
  type iovec,
  readv, writev, preadv, pwritev,
  errno as uio_errno,
  _resetUio, _setUioOs,
} from "./posix/uio.js";

// Linux <sys/sendfile.h> — zero-copy file-to-socket transfer.
// BRIDGE: posix-sendfile.
export {
  sendfile,
  errno as sendfile_errno,
  _resetSendfile, _setSendfileOs,
} from "./posix/sendfile.js";

// Linux <sys/eventfd.h> — user-space event signaling fd.
// BRIDGE: posix-eventfd.
export {
  type eventfd_t,
  eventfd, eventfd_read, eventfd_write,
  closeEventfd, isEventFd,
  EFD_SEMAPHORE, EFD_CLOEXEC, EFD_NONBLOCK,
  errno as eventfd_errno,
  _resetEventfd, _eventfdCount,
} from "./posix/eventfd.js";

// Linux <sys/timerfd.h> — timer file descriptors.
// BRIDGE: posix-timerfd.
export {
  type timespec, type itimerspec,
  timerfd_create, timerfd_settime, timerfd_gettime, timerfd_read,
  closeTimerfd, isTimerFd,
  CLOCK_REALTIME, CLOCK_MONOTONIC, CLOCK_BOOTTIME,
  CLOCK_REALTIME_ALARM, CLOCK_BOOTTIME_ALARM,
  TFD_CLOEXEC, TFD_NONBLOCK, TFD_TIMER_ABSTIME, TFD_TIMER_CANCEL_ON_SET,
  errno as timerfd_errno,
  _resetTimerfd, _timerfdCount, _timerfdEventFd,
} from "./posix/timerfd.js";

// Linux <sys/epoll.h> — Linux event-loop multiplexer.
// BRIDGE: posix-epoll.
export {
  type epoll_event, type epoll_data_t, type EpollReadinessProbe,
  makeEpollEvent,
  epoll_create, epoll_create1, epoll_ctl, epoll_wait, epoll_pwait,
  closeEpoll, isEpollFd,
  notifyReady as epoll_notify_ready,
  clearReady  as epoll_clear_ready,
  setEpollReadinessProbe,
  EPOLL_CLOEXEC,
  EPOLL_CTL_ADD, EPOLL_CTL_DEL, EPOLL_CTL_MOD,
  EPOLLIN, EPOLLPRI, EPOLLOUT, EPOLLERR, EPOLLHUP,
  EPOLLRDNORM, EPOLLRDBAND, EPOLLWRNORM, EPOLLWRBAND, EPOLLMSG,
  EPOLLRDHUP, EPOLLEXCLUSIVE, EPOLLWAKEUP, EPOLLONESHOT, EPOLLET,
  errno as epoll_errno,
  _resetEpoll, _epollCount, _epollInterestSize,
} from "./posix/epoll.js";

// BSD <sys/event.h> — kqueue/kevent multiplexer.
// BRIDGE: posix-kqueue.
export {
  type kevent, type timespec as kqueue_timespec,
  EV_SET,
  kqueue, kevent as kevent_call, closeKqueue, isKqueueFd,
  notifyReady as kqueue_notify_ready,
  clearReady  as kqueue_clear_ready,
  EVFILT_READ, EVFILT_WRITE, EVFILT_AIO, EVFILT_VNODE, EVFILT_PROC,
  EVFILT_SIGNAL, EVFILT_TIMER, EVFILT_MACHPORT, EVFILT_FS, EVFILT_USER,
  EVFILT_VM, EVFILT_EXCEPT,
  EV_ADD, EV_DELETE, EV_ENABLE, EV_DISABLE, EV_ONESHOT, EV_CLEAR,
  EV_RECEIPT, EV_DISPATCH, EV_EOF, EV_ERROR,
  NOTE_SECONDS, NOTE_USECONDS, NOTE_NSECONDS, NOTE_MSECONDS,
  NOTE_DELETE, NOTE_WRITE, NOTE_EXTEND, NOTE_ATTRIB, NOTE_LINK,
  NOTE_RENAME, NOTE_REVOKE,
  NOTE_TRIGGER, NOTE_FFNOP, NOTE_FFAND, NOTE_FFOR, NOTE_FFCOPY,
  NOTE_FFCTRLMASK, NOTE_FFLAGSMASK,
  errno as kqueue_errno,
  _resetKqueue, _kqueueCount, _kqueueEventCount,
} from "./posix/kqueue.js";

// Windows <ioapiset.h> — IOCP (I/O Completion Ports).
// BRIDGE: posix-iocp (stub for Linux+BSD parity; useful as in-process queue).
export {
  type OVERLAPPED, type OVERLAPPED_ENTRY, type GqcsResult, type GqcsExResult,
  CreateIoCompletionPort, GetQueuedCompletionStatus,
  GetQueuedCompletionStatusEx, PostQueuedCompletionStatus, CloseHandle as IocpCloseHandle,
  isIocpHandle,
  GetLastError as Iocp_GetLastError, _setLastError as _iocp_setLastError,
  WINBOOL_TRUE, WINBOOL_FALSE, INVALID_HANDLE_VALUE, INFINITE,
  ERROR_INVALID_HANDLE, ERROR_INVALID_PARAMETER, WAIT_TIMEOUT, ERROR_ABANDONED_WAIT_0,
  _resetIocp, _iocpCount, _iocpQueueDepth,
} from "./posix/iocp.js";

// Linux <sys/signalfd.h> — read signals via fd.
// BRIDGE: posix-signalfd.
export {
  type signalfd_siginfo,
  signalfd, signalfd_read,
  closeSignalfd, isSignalFd,
  SFD_CLOEXEC, SFD_NONBLOCK,
  errno as signalfd_errno,
  _resetSignalfd, _signalfdCount,
  _setSignalDeliveryAPI, _ensureSignalDeliveryLoaded, _injectSignal,
} from "./posix/signalfd.js";

// POSIX <sys/un.h> — Unix domain sockets.
// BRIDGE: posix-un.
export {
  type sockaddr_un,
  un_socket, un_bind, un_listen,
  un_accept, un_accept_async,
  un_connect, un_send, un_recv, un_recv_async, un_close,
  isUnFd, UNIX_PATH_MAX,
  errno as un_errno,
  _resetUn, _unCount,
} from "./posix/un.js";

// POSIX <aio.h> — asynchronous I/O.
// BRIDGE: posix-aio.
export {
  type aiocb,
  aio_read, aio_write, aio_fsync, aio_error, aio_return,
  aio_cancel, aio_suspend, lio_listio,
  LIO_NOWAIT, LIO_WAIT, LIO_NOP, LIO_READ, LIO_WRITE,
  AIO_CANCELED, AIO_NOTCANCELED, AIO_ALLDONE,
  O_DSYNC as AIO_O_DSYNC, O_SYNC as AIO_O_SYNC,
  errno as aio_errno,
  _resetAio, _aioJobCount,
} from "./posix/aio.js";

// POSIX <mqueue.h> — POSIX message queues.
// BRIDGE: posix-mqueue.
export {
  type mqd_t, type mq_attr,
  mq_open, mq_close, mq_unlink,
  mq_send, mq_receive, mq_send_async, mq_receive_async,
  mq_timedsend, mq_timedreceive,
  mq_getattr, mq_setattr, mq_notify,
  isMqd,
  O_RDONLY as MQ_O_RDONLY, O_WRONLY as MQ_O_WRONLY, O_RDWR as MQ_O_RDWR,
  O_CREAT as MQ_O_CREAT, O_EXCL as MQ_O_EXCL, O_NONBLOCK as MQ_O_NONBLOCK,
  errno as mq_errno,
  _resetMq, _mqOpenCount, _mqNameCount,
} from "./posix/mqueue.js";

// POSIX <sys/shm.h> — System V shared memory.
// BRIDGE: posix-sysv-shm.
export {
  type shmid_ds,
  shmget, shmat, shmdt, shmctl,
  IPC_PRIVATE as SHM_IPC_PRIVATE,
  IPC_CREAT as SHM_IPC_CREAT, IPC_EXCL as SHM_IPC_EXCL, IPC_NOWAIT as SHM_IPC_NOWAIT,
  IPC_RMID as SHM_IPC_RMID, IPC_SET as SHM_IPC_SET, IPC_STAT as SHM_IPC_STAT,
  SHM_RDONLY, SHM_RND,
  errno as shm_errno,
  _resetSysvShm, _shmSegCount,
} from "./posix/sysv_shm.js";

// POSIX <sys/sem.h> — System V semaphore sets.
// BRIDGE: posix-sysv-sem.
export {
  type sembuf, type semid_ds,
  semget, semop, semtimedop, semctl,
  IPC_PRIVATE as SEM_IPC_PRIVATE,
  IPC_CREAT as SEM_IPC_CREAT, IPC_EXCL as SEM_IPC_EXCL, IPC_NOWAIT as SEM_IPC_NOWAIT,
  IPC_RMID as SEM_IPC_RMID, IPC_SET as SEM_IPC_SET, IPC_STAT as SEM_IPC_STAT,
  GETVAL, SETVAL, GETALL, SETALL, GETPID, GETNCNT, GETZCNT,
  SEM_UNDO,
  errno as sem_errno,
  _resetSysvSem, _semSetCount,
} from "./posix/sysv_sem.js";

// POSIX <sys/msg.h> — System V message queues.
// BRIDGE: posix-sysv-msg.
export {
  type msgbuf, type msqid_ds,
  msgget, msgsnd, msgrcv, msgctl,
  IPC_PRIVATE as MSG_IPC_PRIVATE,
  IPC_CREAT as MSG_IPC_CREAT, IPC_EXCL as MSG_IPC_EXCL, IPC_NOWAIT as MSG_IPC_NOWAIT,
  IPC_RMID as MSG_IPC_RMID, IPC_SET as MSG_IPC_SET, IPC_STAT as MSG_IPC_STAT,
  MSG_NOERROR, MSG_EXCEPT,
  errno as msg_errno,
  _resetSysvMsg, _msgQueueCount,
} from "./posix/sysv_msg.js";

// POSIX <unistd.h> getopt + GNU <getopt.h> getopt_long.
// BRIDGE: posix-getopt.
export {
  type option,
  no_argument, required_argument, optional_argument,
  getopt, getopt_long, getopt_long_only,
  _resetGetopt, _setOpterr, _setOptind, _setOptreset,
} from "./posix/getopt.js";

// Mutable POSIX-mandated globals — re-exported by name (not by value); Mirage
// keeps the live module-level mutables in posix/getopt.ts. Translated code
// reads the current values via the helper accessors below.
import * as _getoptMod from "./posix/getopt.js";
/** POSIX optarg — argument string of the most recent option (live). */
export function getopt_optarg(): string | null { return _getoptMod.optarg; }
/** POSIX optind — index of next argv element (live). */
export function getopt_optind(): number { return _getoptMod.optind; }
/** POSIX opterr — diagnostic-print toggle (live). */
export function getopt_opterr(): number { return _getoptMod.opterr; }
/** POSIX optopt — last unrecognized option char (live). */
export function getopt_optopt(): number { return _getoptMod.optopt; }
/** Test/runtime helper — set opterr (POSIX writable). */
export function getopt_set_opterr(v: number): void { _getoptMod._setOpterr(v); }
/** Test/runtime helper — set optind (POSIX writable; restart parsing). */
export function getopt_set_optind(v: number): void { _getoptMod._setOptind(v); }
/** BSD optreset — set to 1 to restart parsing on a new argv. */
export function getopt_set_optreset(v: number): void { _getoptMod._setOptreset(v); }

// POSIX <termios.h> — terminal I/O attributes + raw mode + VMIN/VTIME.
// BRIDGE: posix-termios.
export {
  type termios, type VminVtimeRegime,
  makeTermios,
  tcgetattr, tcsetattr, tcdrain, tcflush, tcflow, tcsendbreak, tcgetsid,
  cfgetispeed, cfgetospeed, cfsetispeed, cfsetospeed, cfsetspeed,
  cfmakeraw, posix_raw_mode_helper, posix_vmin_vtime_regime,
  // c_cc[] subscripts
  VINTR, VQUIT, VERASE, VKILL, VEOF, VTIME, VMIN, VSWTC,
  VSTART, VSTOP, VSUSP, VEOL, VREPRINT, VDISCARD, VWERASE, VLNEXT, VEOL2,
  NCCS,
  // c_iflag
  IGNBRK, BRKINT, IGNPAR, PARMRK, INPCK, ISTRIP, INLCR, IGNCR, ICRNL,
  IUCLC, IXON, IXANY, IXOFF, IMAXBEL, IUTF8,
  // c_oflag
  OPOST, OLCUC, ONLCR, OCRNL, ONOCR, ONLRET, OFILL, OFDEL,
  // c_cflag
  CSIZE, CS5, CS6, CS7, CS8, CSTOPB, CREAD, PARENB, PARODD, HUPCL,
  CLOCAL, CRTSCTS,
  // c_lflag
  ISIG, ICANON, XCASE, ECHO, ECHOE, ECHOK, ECHONL, NOFLSH, TOSTOP,
  ECHOCTL, ECHOPRT, ECHOKE, FLUSHO, PENDIN, IEXTEN,
  // baud rates
  B0, B50, B75, B110, B134, B150, B200, B300, B600, B1200, B1800, B2400,
  B4800, B9600, B19200, B38400, B57600, B115200, B230400,
  // tcsetattr / tcflush / tcflow constants
  TCSANOW, TCSADRAIN, TCSAFLUSH,
  TCIFLUSH, TCOFLUSH, TCIOFLUSH,
  TCOOFF, TCOON, TCIOFF, TCION,
  errno as termios_errno,
  _resetTermios, _shadowFor as _termios_shadowFor,
} from "./posix/termios.js";

// POSIX <unistd.h>/<pwd.h>/<grp.h> small surfaces — getlogin, getpwuid,
// getgrgid, getgroups, sysconf, pathconf, confstr, nice.
// BRIDGE: posix-unistd-misc.
export {
  type passwd, type group,
  getlogin, getlogin_r,
  getpwuid, getpwnam, getpwuid_r, getpwnam_r,
  getpwent, setpwent, endpwent,
  getgrgid, getgrnam, getgrent, setgrent, endgrent,
  getgroups,
  sysconf, pathconf, fpathconf, confstr,
  nice,
  // sysconf names
  _SC_ARG_MAX, _SC_CHILD_MAX, _SC_CLK_TCK, _SC_NGROUPS_MAX, _SC_OPEN_MAX,
  _SC_STREAM_MAX, _SC_TZNAME_MAX, _SC_JOB_CONTROL, _SC_SAVED_IDS,
  _SC_VERSION, _SC_LINE_MAX, _SC_PAGESIZE, _SC_PAGE_SIZE,
  _SC_NPROCESSORS_CONF, _SC_NPROCESSORS_ONLN,
  _SC_PHYS_PAGES, _SC_AVPHYS_PAGES,
  _SC_HOST_NAME_MAX, _SC_LOGIN_NAME_MAX, _SC_TTY_NAME_MAX,
  _SC_GETPW_R_SIZE_MAX, _SC_GETGR_R_SIZE_MAX, _SC_SYMLOOP_MAX,
  // pathconf names
  _PC_LINK_MAX, _PC_MAX_CANON, _PC_MAX_INPUT, _PC_NAME_MAX, _PC_PATH_MAX,
  _PC_PIPE_BUF, _PC_CHOWN_RESTRICTED, _PC_NO_TRUNC, _PC_VDISABLE,
  _PC_SYNC_IO, _PC_ASYNC_IO, _PC_PRIO_IO, _PC_SOCK_MAXBUF,
  _PC_FILESIZEBITS, _PC_REC_INCR_XFER_SIZE, _PC_REC_MAX_XFER_SIZE,
  _PC_REC_MIN_XFER_SIZE, _PC_REC_XFER_ALIGN, _PC_ALLOC_SIZE_MIN,
  _PC_SYMLINK_MAX, _PC_2_SYMLINKS,
  // confstr names
  _CS_PATH, _CS_GNU_LIBC_VERSION, _CS_GNU_LIBPTHREAD_VERSION,
  _CS_POSIX_V7_ILP32_OFF32_CFLAGS,
  errno as unistd_misc_errno,
  _resetUnistdMisc, _setInjectedUser as _unistd_misc_setInjectedUser,
  _getNiceLevel, _resetNiceLevel,
} from "./posix/unistd_misc.js";

// POSIX <fnmatch.h>. BRIDGE: posix-fnmatch.
export {
  fnmatch,
  FNM_NOMATCH, FNM_PATHNAME, FNM_NOESCAPE, FNM_PERIOD,
  FNM_LEADING_DIR, FNM_CASEFOLD,
} from "./posix/fnmatch.js";

// POSIX <glob.h>. BRIDGE: posix-glob.
export {
  type glob_t, glob, globfree,
  GLOB_ERR, GLOB_MARK, GLOB_NOSORT, GLOB_DOOFFS, GLOB_NOCHECK,
  GLOB_APPEND, GLOB_NOESCAPE, GLOB_PERIOD, GLOB_MAGCHAR,
  GLOB_BRACE, GLOB_TILDE, GLOB_ONLYDIR,
  GLOB_NOSPACE, GLOB_ABORTED, GLOB_NOMATCH,
} from "./posix/glob.js";

// POSIX <wordexp.h>. BRIDGE: posix-wordexp.
export {
  type wordexp_t, wordexp, wordfree,
  WRDE_DOOFFS, WRDE_APPEND, WRDE_NOCMD, WRDE_REUSE, WRDE_SHOWERR, WRDE_UNDEF,
  WRDE_NOSPACE, WRDE_BADCHAR, WRDE_BADVAL, WRDE_CMDSUB, WRDE_SYNTAX,
} from "./posix/wordexp.js";

// POSIX <syslog.h>. BRIDGE: posix-syslog.
export {
  openlog, closelog, syslog, vsyslog, setlogmask,
  LOG_MASK, LOG_UPTO, LOG_PRI, LOG_FAC, LOG_MAKEPRI,
  LOG_EMERG, LOG_ALERT, LOG_CRIT, LOG_ERR, LOG_WARNING,
  LOG_NOTICE, LOG_INFO, LOG_DEBUG,
  LOG_KERN, LOG_USER, LOG_MAIL, LOG_DAEMON, LOG_AUTH, LOG_SYSLOG,
  LOG_LPR, LOG_NEWS, LOG_UUCP, LOG_CRON, LOG_AUTHPRIV, LOG_FTP,
  LOG_LOCAL0, LOG_LOCAL1, LOG_LOCAL2, LOG_LOCAL3,
  LOG_LOCAL4, LOG_LOCAL5, LOG_LOCAL6, LOG_LOCAL7,
  LOG_PID, LOG_CONS, LOG_ODELAY, LOG_NDELAY, LOG_NOWAIT, LOG_PERROR,
  _resetSyslog,
} from "./posix/syslog.js";

// POSIX <sys/resource.h>. BRIDGE: posix-resource.
export {
  type rlimit, type rusage, type timeval as rusage_timeval,
  getrlimit, setrlimit, getrusage,
  getpriority, setpriority,
  RLIMIT_CPU, RLIMIT_FSIZE, RLIMIT_DATA, RLIMIT_STACK, RLIMIT_CORE,
  RLIMIT_RSS, RLIMIT_NPROC, RLIMIT_NOFILE, RLIMIT_MEMLOCK, RLIMIT_AS,
  RLIMIT_LOCKS, RLIMIT_SIGPENDING, RLIMIT_MSGQUEUE, RLIMIT_NICE,
  RLIMIT_RTPRIO, RLIMIT_RTTIME, RLIM_NLIMITS,
  RLIM_INFINITY, RLIM_SAVED_MAX, RLIM_SAVED_CUR,
  RUSAGE_SELF, RUSAGE_CHILDREN, RUSAGE_THREAD,
  PRIO_PROCESS, PRIO_PGRP, PRIO_USER,
  errno as resource_errno,
  _resetResource,
} from "./posix/resource.js";

// POSIX <fcntl.h> file locking + BSD flock(2). BRIDGE: posix-file-lock.
export {
  type flock,
  type FdInodeResolver, type FdSizeResolver,
  fcntl_getlk, fcntl_setlk, fcntl_setlkw, fcntl_lock,
  flock as bsd_flock,
  fileLockReleaseOnClose, makeFlock,
  F_RDLCK, F_WRLCK, F_UNLCK,
  F_GETLK, F_SETLK, F_SETLKW,
  SEEK_SET as FLOCK_SEEK_SET, SEEK_CUR as FLOCK_SEEK_CUR, SEEK_END as FLOCK_SEEK_END,
  LOCK_SH, LOCK_EX, LOCK_NB, LOCK_UN,
  errno as file_lock_errno,
  _resetFileLock, _setInodeResolver, _getInodeResolver,
  _setOwnerPid, _getOwnerPid, _setFdSizeResolver,
  _lockTableSize, _locksOnFd,
} from "./posix/file_lock.js";

// POSIX <time.h> per-process timers. BRIDGE: posix-timer.
export {
  type timer_t, type sigevent, type sigval,
  type timespec as timer_timespec, type itimerspec as timer_itimerspec,
  timer_create, timer_settime, timer_gettime, timer_getoverrun, timer_delete,
  makeSigevent, makeItimerspec,
  CLOCK_REALTIME as TIMER_CLOCK_REALTIME,
  CLOCK_MONOTONIC as TIMER_CLOCK_MONOTONIC,
  CLOCK_PROCESS_CPUTIME_ID, CLOCK_THREAD_CPUTIME_ID,
  CLOCK_MONOTONIC_RAW, CLOCK_REALTIME_COARSE, CLOCK_MONOTONIC_COARSE,
  CLOCK_BOOTTIME as TIMER_CLOCK_BOOTTIME,
  SIGEV_NONE, SIGEV_SIGNAL, SIGEV_THREAD, SIGEV_THREAD_ID,
  TIMER_ABSTIME,
  errno as posix_timer_errno,
  _resetPosixTimer, _timerCount, _timerSpec,
  _setSignalDeliveryAPI as _setPosixTimerSignalDeliveryAPI,
} from "./posix/posix_timer.js";

// POSIX <spawn.h>. BRIDGE: posix-spawn.
export {
  type posix_spawn_file_actions_t, type posix_spawnattr_t,
  type sigset_t as spawn_sigset_t, type sched_param,
  posix_spawn, posix_spawnp,
  posix_spawn_file_actions_init, posix_spawn_file_actions_destroy,
  posix_spawn_file_actions_addopen, posix_spawn_file_actions_addclose,
  posix_spawn_file_actions_adddup2,
  posix_spawn_file_actions_addchdir_np, posix_spawn_file_actions_addfchdir_np,
  posix_spawnattr_init, posix_spawnattr_destroy,
  posix_spawnattr_setflags, posix_spawnattr_getflags,
  posix_spawnattr_setpgroup, posix_spawnattr_getpgroup,
  posix_spawnattr_setsigdefault, posix_spawnattr_getsigdefault,
  posix_spawnattr_setsigmask, posix_spawnattr_getsigmask,
  posix_spawnattr_setschedparam, posix_spawnattr_getschedparam,
  posix_spawnattr_setschedpolicy, posix_spawnattr_getschedpolicy,
  POSIX_SPAWN_RESETIDS, POSIX_SPAWN_SETPGROUP, POSIX_SPAWN_SETSIGDEF,
  POSIX_SPAWN_SETSIGMASK, POSIX_SPAWN_SETSCHEDPARAM, POSIX_SPAWN_SETSCHEDULER,
  POSIX_SPAWN_USEVFORK, POSIX_SPAWN_SETSID,
  errno as posix_spawn_errno,
  _resetPosixSpawn,
} from "./posix/posix_spawn.js";

// POSIX <sys/socket.h> + <netdb.h> — BSD sockets free-function surface.
export {
  socket as posix_socket,
  bind as posix_bind,
  listen as posix_listen,
  accept as posix_accept,
  connect as posix_connect,
  send as posix_send,
  recv as posix_recv,
  sendto as posix_sendto,
  recvfrom as posix_recvfrom,
  shutdown as posix_shutdown,
  closeSocket as posix_close_socket,
  isSocketFd as posix_is_socket_fd,
  setsockopt as posix_setsockopt,
  getsockopt as posix_getsockopt,
  getsockname as posix_getsockname,
  getpeername as posix_getpeername,
  getaddrinfo as posix_getaddrinfo,
  freeaddrinfo as posix_freeaddrinfo,
  getnameinfo as posix_getnameinfo,
  gai_strerror as posix_gai_strerror,
  EBADF as POSIX_EBADF,
  TCP_NODELAY,
  isNodeRuntime as posix_is_node_runtime,
  hasWebTransport as posix_has_webtransport,
  hasWebSocket as posix_has_websocket,
  _resetSockets as _posix_reset_sockets,
  __posix_sockets_backend,
} from "./posix/sockets.js";

// POSIX raw sockets — SOCK_RAW + IP_HDRINCL packet construction.
export {
  raw_socket as posix_raw_socket,
  raw_bind as posix_raw_bind,
  raw_sendto as posix_raw_sendto,
  raw_recvfrom as posix_raw_recvfrom,
  raw_setsockopt as posix_raw_setsockopt,
  raw_getsockopt as posix_raw_getsockopt,
  raw_close as posix_raw_close,
  isRawSocketFd as posix_is_raw_socket_fd,
  build_ipv4_header as posix_build_ipv4_header,
  IPPROTO_ICMP, IPPROTO_IGMP, IPPROTO_RAW, IPPROTO_ICMPV6, IPPROTO_SCTP as POSIX_IPPROTO_SCTP_RAW,
  IP_HDRINCL, IP_TTL, IP_TOS, IP_RECVTTL, IP_RECVTOS, IP_PKTINFO,
  ICMP_FILTER, SOL_IP, SOL_IPV6, IPV6_HDRINCL,
  EOPNOTSUPP as POSIX_EOPNOTSUPP_RAW,
  EACCES as POSIX_EACCES_RAW,
  EPERM as POSIX_EPERM_RAW,
  _resetRawSockets as _posix_reset_raw_sockets,
} from "./posix/raw_sockets.js";

// POSIX <netinet/sctp.h> — SCTP socket extensions.
export {
  sctp_socket,
  sctp_bindx,
  sctp_connectx,
  sctp_peeloff,
  sctp_getladdrs,
  sctp_freeladdrs,
  sctp_getpaddrs,
  sctp_freepaddrs,
  sctp_sendmsg,
  sctp_recvmsg,
  sctp_opt_info,
  sctp_get_peer_addr_info,
  sctp_setsockopt,
  sctp_close,
  isSctpFd as posix_is_sctp_fd,
  IPPROTO_SCTP,
  SOCK_SEQPACKET,
  SCTP_RTOINFO, SCTP_ASSOCINFO, SCTP_INITMSG, SCTP_NODELAY, SCTP_AUTOCLOSE,
  SCTP_PRIMARY_ADDR, SCTP_ADAPTATION_LAYER, SCTP_DISABLE_FRAGMENTS,
  SCTP_PEER_ADDR_PARAMS, SCTP_DEFAULT_SEND_PARAM, SCTP_EVENTS,
  SCTP_MAXSEG, SCTP_STATUS, SCTP_GET_PEER_ADDR_INFO, SCTP_DELAYED_SACK,
  SCTP_FRAGMENT_INTERLEAVE, SCTP_PARTIAL_DELIVERY_POINT, SCTP_MAX_BURST,
  SCTP_AUTH_CHUNK, SCTP_HMAC_IDENT, SCTP_AUTH_KEY,
  SCTP_PEER_AUTH_CHUNKS, SCTP_LOCAL_AUTH_CHUNKS,
  SCTP_GET_ASSOC_NUMBER, SCTP_GET_ASSOC_ID_LIST, SCTP_AUTH_ACTIVE_KEY,
  SCTP_UNORDERED, SCTP_ADDR_OVER, SCTP_ABORT, SCTP_SACK_IMMEDIATELY, SCTP_EOF,
  SCTP_BINDX_ADD_ADDR, SCTP_BINDX_REM_ADDR,
  SCTP_ASSOC_CHANGE, SCTP_PEER_ADDR_CHANGE, SCTP_REMOTE_ERROR,
  SCTP_SEND_FAILED, SCTP_SHUTDOWN_EVENT, SCTP_ADAPTATION_INDICATION,
  SCTP_PARTIAL_DELIVERY_EVENT, SCTP_AUTHENTICATION_EVENT,
  _resetSctp as _posix_reset_sctp,
} from "./posix/sctp.js";

// POSIX sigaltstack — alternate-signal-stack tracking.
export {
  sigaltstack,
  SS_ONSTACK, SS_DISABLE,
  MINSIGSTKSZ, SIGSTKSZ,
  _currentSigaltstack,
  _setSigaltstackTid,
  _resetSigaltstack,
  type stack_t,
} from "./posix/sigaltstack.js";

// POSIX sigwait family — wraps concurrency/signal-delivery for Mirage callers.
export {
  sigwait,
  sigwaitinfo,
  sigtimedwait,
  alloc_sigset,
  sigemptyset as posix_sigemptyset,
  sigfillset  as posix_sigfillset,
  sigaddset   as posix_sigaddset,
  sigdelset   as posix_sigdelset,
  sigismember as posix_sigismember,
  _setSigwaitAPI,
  _resetSigwait,
  _ensureSigwaitAPI,
  type siginfo_t,
} from "./posix/sigwait.js";

// ---------------------------------------------------------------------------
// POSIX free-function surface. IEEE Std 1003.1-2017.
//
// C programs call getpid(), fork(), chmod(...) as free functions — not as
// methods on an OS object. The wrappers below dispatch to a lazily-initialised
// module-level MirageOS singleton so translated code can `import { getpid }
// from "mirage"` and get POSIX behaviour without needing to construct the OS.
//
// `errno` is a module-level mutable number (POSIX §2.3 — errno may be set by
// any function that fails). Functions that are not yet implemented set
// `errno = ENOSYS` and return -1, matching POSIX "function not implemented"
// semantics.
// ---------------------------------------------------------------------------

import { MirageOS as _MirageOSCtor } from "./os.js";
import { ENOSYS as _ENOSYS } from "./network/network.js";
import type { Stat as _Stat } from "./posix/stat.js";

let _singletonMirage: InstanceType<typeof _MirageOSCtor> | null = null;
function _os(): InstanceType<typeof _MirageOSCtor> {
  if (_singletonMirage === null) _singletonMirage = new _MirageOSCtor();
  return _singletonMirage;
}

/** POSIX errno — IEEE Std 1003.1-2017 §2.3. Last error value from a POSIX
 *  call. Reset on success is NOT required by the standard, so callers should
 *  clear it before the call if they intend to test it afterwards. */
export let errno: number = 0;

/** Test-only: reset the module-level Mirage singleton and errno. */
export function _resetPosixFreeFuncs(): void {
  _singletonMirage = null;
  errno = 0;
}

// --- Process / identity (POSIX §2.4) ---------------------------------------

export function getpid(): number { return _os().getpid(); }
export function getppid(): number { return _os().getppid(); }
export function getuid(): number { return _os().getuid(); }
export function geteuid(): number { return _os().geteuid(); }
export function getgid(): number { return _os().getgid(); }
export function getegid(): number { return _os().getegid(); }

/** POSIX fork() — IEEE Std 1003.1-2017 §fork.
 *  The POSIX-style return-twice shape cannot be implemented in synchronous
 *  JS; callers must use the callback form via `forkSync(childFn)` or
 *  `MirageOS.fork(childFn)`. The bare free-function here is preserved for
 *  translators that emit `fork()` as a pre-condition check and then route
 *  through the callback form at the emission site. Returns -1 with
 *  errno=ENOSYS so legacy callers see a spec-compliant failure. */
export function fork(): number {
  errno = _ENOSYS;
  return -1;
}

/** POSIX fork() (callback form) — runs `childFn` synchronously as the
 *  child and returns the new PID to the caller (who is the parent).
 *  See `ProcessTable.forkSync`. */
export function forkSync(childFn: (childPid: number) => void): number {
  return _os().fork(childFn);
}

/** POSIX execl() — IEEE Std 1003.1-2017 §exec. Delegates to MirageOS. */
export function execl(path: string, ...args: string[]): number {
  return _os().execl(path, ...args);
}

/** POSIX execv() — IEEE Std 1003.1-2017 §exec. */
export function execv(path: string, argv: string[]): number {
  return _os().execv(path, argv);
}

/** POSIX execvp() — IEEE Std 1003.1-2017 §exec. */
export function execvp(file: string, argv: string[]): number {
  return _os().execvp(file, argv);
}

/** POSIX execve() — IEEE Std 1003.1-2017 §exec. */
export function execve(path: string, argv: string[], envp: string[]): number {
  // Convert envp (["K=V", ...]) to record form.
  const env: Record<string, string> = {};
  for (const kv of envp) {
    const eq = kv.indexOf("=");
    if (eq < 0) continue;
    env[kv.slice(0, eq)] = kv.slice(eq + 1);
  }
  return _os().execve(path, argv, env);
}

/** POSIX wait() — IEEE Std 1003.1-2017 §wait. */
export function wait(statusPtr: { status?: number } | null): number {
  return _os().wait(statusPtr);
}

/** POSIX waitpid() — IEEE Std 1003.1-2017 §waitpid. */
export function waitpid(
  pid: number,
  statusPtr: { status?: number } | null,
  options: number = 0,
): number {
  return _os().waitpid(pid, statusPtr, options);
}

/** POSIX waitid() — IEEE Std 1003.1-2017 §waitid. Returns 0/-1; fills siginfo. */
export function waitid(
  idtype: number,
  id: number,
  info: import("./process/process.js").SigInfoWait,
  options: number = 0,
): number {
  return _os().waitid(idtype, id, info, options);
}

/** BSD/Linux wait4() — waitpid + struct rusage. */
export function wait4(
  pid: number,
  statusPtr: { status?: number } | null,
  options: number,
  rusage: import("./process/process.js").RUsage | null,
): number {
  return _os().wait4(pid, statusPtr, options, rusage);
}

/** POSIX _exit() — IEEE Std 1003.1-2017 §_exit. */
export function _exit(code: number = 0): never {
  return _os()._exit(code);
}

/** POSIX kill() — IEEE Std 1003.1-2017 §kill. Delegates to MirageOS.kill. */
export function kill(pid: number, sig: number): number {
  return _os().kill(pid, sig);
}

/** POSIX system(command) — IEEE Std 1003.1-2017 §system. C17 §7.22.4.8.
 *  BRIDGE: POSIX-system → node:child_process.spawnSync(/bin/sh -c …).
 *  command == null returns 1 (shell available). Otherwise runs the command
 *  via the host shell and returns a wait()-encodable status word. */
export function system(command: string | null): number {
  return _os().system(command);
}

// --- Time (POSIX §2.7) ------------------------------------------------------

/** POSIX gettimeofday(tv, tz) — IEEE Std 1003.1-2017 §gettimeofday.
 *  Writes seconds/microseconds into the tv object (tv_sec / tv_usec). The tz
 *  argument is obsolete (POSIX marks it as such) and is ignored. */
export function gettimeofday(
  tvPtr: { tv_sec?: number; tv_usec?: number } | null,
  _tzPtr: unknown,
): number {
  if (!tvPtr) { errno = 22 /*EINVAL*/; return -1; }
  const tv = _os().clock.gettimeofday();
  tvPtr.tv_sec = tv.sec;
  tvPtr.tv_usec = tv.usec;
  return 0;
}

/** POSIX clock_gettime(clk_id, tsPtr) — IEEE Std 1003.1-2017 §clock_gettime.
 *  Writes seconds/nanoseconds into the timespec object. `clk_id` is accepted
 *  but the underlying Mirage Clock is a single monotonic+real source. */
export function clock_gettime(
  _clk_id: number,
  tsPtr: { tv_sec?: number; tv_nsec?: number } | null,
): number {
  if (!tsPtr) { errno = 22 /*EINVAL*/; return -1; }
  const ts = _os().clock.clockGettime();
  tsPtr.tv_sec = ts.sec;
  tsPtr.tv_nsec = ts.nsec;
  return 0;
}

/** POSIX nanosleep(req, rem) — IEEE Std 1003.1-2017 §nanosleep.
 *  In the single-threaded browser model we cannot block; we return 0 and
 *  write a zero remainder (the requested time is "elapsed" instantly). */
export function nanosleep(
  _reqPtr: { tv_sec?: number; tv_nsec?: number } | null,
  remPtr: { tv_sec?: number; tv_nsec?: number } | null,
): number {
  if (remPtr) { remPtr.tv_sec = 0; remPtr.tv_nsec = 0; }
  return 0;
}

export function sleep(sec: number): number { return _os().sleep(sec); }
export function usleep(usec: number): number { return _os().usleep(usec); }

// --- File permissions / metadata (POSIX §2.5) ------------------------------

export function chmod(path: string, mode: number): number {
  return _os().chmod(path, mode);
}

/** POSIX fchmod() — IEEE Std 1003.1-2017 §fchmod. Change mode of an open fd.
 *  Resolves the fd's backing path via the FdTable and delegates to chmod(). */
export function fchmod(fd: number, mode: number): number {
  const os = _os();
  const p = os.fds.pathOf(fd);
  if (!p) { errno = 9 /*EBADF*/; return -1; }
  return os.chmod(p, mode);
}

/** POSIX utime() — IEEE Std 1003.1-2017 §utime. Update file times.
 *  The Mirage VFS does not track independent atime/mtime (only modified), so
 *  this is a stub that validates the path exists. */
export function utime(
  path: string,
  _buf: { actime?: number; modtime?: number } | null,
): number {
  const os = _os();
  if (!os.vfs.exists(os.env.resolve(path))) { errno = 2 /*ENOENT*/; return -1; }
  return 0;
}

export function access(path: string, mode: number): number {
  return _os().access(path, mode);
}

/** POSIX stat(path, statPtr) — IEEE Std 1003.1-2017 §stat.
 *  Writes fields of the struct stat into statPtr and returns 0, or -1 on
 *  error. `st_mode` is written as a plain numeric field (no packing). */
export function stat(
  path: string,
  statPtr: Partial<_Stat> | null,
): number {
  const s = _os().stat(path);
  if (s === null) { errno = 2 /*ENOENT*/; return -1; }
  if (statPtr) Object.assign(statPtr, s);
  return 0;
}

/** POSIX fstat(fd, statPtr) — IEEE Std 1003.1-2017 §fstat. */
export function fstat(fd: number, statPtr: Partial<_Stat> | null): number {
  const s = _os().fstat(fd);
  if (s === null) { errno = 9 /*EBADF*/; return -1; }
  if (statPtr) Object.assign(statPtr, s);
  return 0;
}

/** POSIX lstat(path, statPtr) — IEEE Std 1003.1-2017 §lstat. */
export function lstat(path: string, statPtr: Partial<_Stat> | null): number {
  const s = _os().lstat(path);
  if (s === null) { errno = 2 /*ENOENT*/; return -1; }
  if (statPtr) Object.assign(statPtr, s);
  return 0;
}
