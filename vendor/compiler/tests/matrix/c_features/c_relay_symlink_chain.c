/* POSIX.1-2017 symlink(2) / readlink(2) / lstat(2) round-trip exercising
 * async-Relay threading.
 *
 * Writes a target file, creates a symlink, reads the link back, and checks
 * with lstat that the link is classified as a symlink via S_ISLNK(st_mode).
 * The emitter must turn symlink/readlink/lstat into `await relay.*`; the
 * enclosing main() must be emitted as `async function main(): Promise<int>`
 * and the entry point must be `main().then(rc => process.exit(rc ?? 0))`.
 *
 * Platform note: symlink creation on Windows needs developer mode or an
 * admin token; this test is allow-listed to SKIP cleanly on Windows.
 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>

int main(void) {
    const char *target = "chain_target.txt";
    const char *link   = "chain_link.txt";

    FILE *f = fopen(target, "w");
    if (!f) { printf("FAIL create-target\n"); return 1; }
    fputs("hi", f);
    fclose(f);

    if (symlink(target, link) != 0) {
        printf("SKIP symlink-unsupported\n");
        unlink(target);
        return 0;
    }

    char buf[256];
    ssize_t n = readlink(link, buf, sizeof(buf) - 1);
    if (n <= 0) { printf("FAIL readlink\n"); unlink(link); unlink(target); return 1; }
    buf[n] = 0;
    if (strcmp(buf, target) != 0) {
        printf("FAIL target-mismatch\n");
        unlink(link); unlink(target);
        return 1;
    }

    struct stat st;
    if (lstat(link, &st) != 0) {
        printf("FAIL lstat\n");
        unlink(link); unlink(target);
        return 1;
    }
    if (!S_ISLNK(st.st_mode)) {
        printf("FAIL not-symlink\n");
        unlink(link); unlink(target);
        return 1;
    }

    unlink(link);
    unlink(target);
    printf("OK\n");
    return 0;
}
