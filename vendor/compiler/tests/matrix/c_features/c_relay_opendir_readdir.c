/* POSIX.1-2017 §5.1.2 opendir / readdir / closedir streaming walk.
 *
 * Creates a scratch directory with three files, opens the directory, walks
 * every entry via readdir(), closes the handle, and verifies that the
 * expected names were seen. Prints OK on success.
 *
 * Relay binding: fs.opendir / fs.readdirStream / fs.closedir. The emitter
 * translates opendir/readdir/closedir into `await relay.fsOpendir(...)` etc.,
 * which means main() must be async and the process exit must be threaded
 * through `main().then(rc => process.exit(rc ?? 0))`.
 *
 * Platform note: on Windows with MinGW the C reference build may lack the
 * POSIX <dirent.h> surface; this test is allow-listed to skip the C
 * reference on that toolchain and rely on the TypeScript side alone.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>
#include <unistd.h>

int main(void) {
    const char *dir = "opendir_scratch";
    mkdir(dir, 0755);

    const char *names[] = { "alpha.txt", "beta.txt", "gamma.txt" };
    for (int i = 0; i < 3; i++) {
        char path[256];
        snprintf(path, sizeof(path), "%s/%s", dir, names[i]);
        FILE *f = fopen(path, "w");
        if (!f) { printf("FAIL create\n"); return 1; }
        fclose(f);
    }

    DIR *d = opendir(dir);
    if (!d) { printf("FAIL opendir\n"); return 1; }

    int saw_alpha = 0, saw_beta = 0, saw_gamma = 0;
    struct dirent *e;
    while ((e = readdir(d)) != NULL) {
        if (strcmp(e->d_name, "alpha.txt") == 0) saw_alpha = 1;
        else if (strcmp(e->d_name, "beta.txt") == 0) saw_beta = 1;
        else if (strcmp(e->d_name, "gamma.txt") == 0) saw_gamma = 1;
    }
    closedir(d);

    for (int i = 0; i < 3; i++) {
        char path[256];
        snprintf(path, sizeof(path), "%s/%s", dir, names[i]);
        unlink(path);
    }
    rmdir(dir);

    if (!(saw_alpha && saw_beta && saw_gamma)) {
        printf("FAIL missing\n");
        return 1;
    }
    printf("OK\n");
    return 0;
}
