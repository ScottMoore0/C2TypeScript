/* POSIX.1-2017 symlink(2) / readlink(2) / lstat(2) round-trip.
 *
 * Creates a target file, symlinks to it, reads the link back, and stats the
 * link with lstat to confirm it is reported as a symbolic link (S_ISLNK).
 *
 * Relay binding: fs.symlink / fs.readlink / fs.lstat handlers.
 *
 * Platform note: symlink creation on Windows requires admin/developer-mode.
 * The translated TS test should fall back to documenting a skip when the
 * relay returns `{ success: false }`.
 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>

int main(void) {
    const char *target = "sym_target.txt";
    const char *link   = "sym_link.txt";
    FILE *f = fopen(target, "w");
    if (!f) { printf("FAIL fopen\n"); return 1; }
    fputs("hello", f);
    fclose(f);

    if (symlink(target, link) != 0) {
        /* Skip if symlink creation isn't permitted on this platform. */
        printf("SKIP symlink-unsupported\n");
        return 0;
    }

    char buf[256];
    ssize_t n = readlink(link, buf, sizeof(buf) - 1);
    if (n <= 0) { printf("FAIL readlink\n"); return 1; }
    buf[n] = 0;
    if (strcmp(buf, target) != 0) { printf("FAIL target-mismatch\n"); return 1; }

    struct stat st;
    if (lstat(link, &st) != 0) { printf("FAIL lstat\n"); return 1; }
    if (!S_ISLNK(st.st_mode)) { printf("FAIL not-symlink\n"); return 1; }

    unlink(link);
    unlink(target);
    printf("OK\n");
    return 0;
}
