/* POSIX / SUSv2-extension forkpty(3) basic echo round-trip.
 *
 * Platform caveat: forkpty requires <pty.h> which is Linux/BSD. The
 * translated TS version runs through the Relay's pty.forkpty handler, which
 * uses node-pty when available and falls back to a child_process pipe
 * otherwise.
 *
 * Scope: THIS TEST IS NODE-ONLY. It cannot run in a browser because PTYs
 * have no browser equivalent — a relay server is required.
 */
#if defined(__linux__) || defined(__APPLE__) || defined(__FreeBSD__)
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pty.h>

int main(void) {
    int master_fd;
    pid_t pid = forkpty(&master_fd, NULL, NULL, NULL);
    if (pid < 0) { printf("FAIL forkpty\n"); return 1; }
    if (pid == 0) {
        /* Child: write a marker to stdout (the pty slave). */
        write(1, "hello-pty", 9);
        _exit(0);
    }
    /* Parent: read from master and look for the marker. */
    char buf[256] = {0};
    ssize_t total = 0;
    for (int tries = 0; tries < 40 && total < (ssize_t)sizeof(buf) - 1; tries++) {
        ssize_t n = read(master_fd, buf + total, sizeof(buf) - 1 - total);
        if (n > 0) total += n;
        else break;
        if (strstr(buf, "hello-pty")) break;
        usleep(25000);
    }
    close(master_fd);
    if (!strstr(buf, "hello-pty")) { printf("FAIL no-marker\n"); return 1; }
    printf("OK\n");
    return 0;
}
#else
#include <stdio.h>
int main(void) { printf("SKIP pty-not-supported\n"); return 0; }
#endif
