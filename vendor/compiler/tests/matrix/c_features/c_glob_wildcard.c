/* POSIX.1-2017 §5.1.3 glob(3) with the "*.txt" wildcard.
 *
 * Creates three .txt files + one .md file, globs "*.txt", and expects exactly
 * three matches. Relay binding: fs.glob (flags=0, default sort).
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <glob.h>
#include <sys/stat.h>
#include <unistd.h>

int main(void) {
    const char *dir = "glob_scratch";
    mkdir(dir, 0755);
    const char *files[] = { "one.txt", "two.txt", "three.txt", "skip.md" };
    for (int i = 0; i < 4; i++) {
        char buf[128];
        snprintf(buf, sizeof(buf), "%s/%s", dir, files[i]);
        FILE *f = fopen(buf, "w");
        if (!f) { printf("FAIL fopen\n"); return 1; }
        fclose(f);
    }

    char pattern[256];
    snprintf(pattern, sizeof(pattern), "%s/*.txt", dir);

    glob_t g;
    int rc = glob(pattern, 0, NULL, &g);
    if (rc != 0) { printf("FAIL glob rc=%d\n", rc); return 1; }
    if (g.gl_pathc != 3) { printf("FAIL count=%zu\n", (size_t)g.gl_pathc); return 1; }

    /* Verify each match ends with .txt */
    for (size_t i = 0; i < g.gl_pathc; i++) {
        size_t n = strlen(g.gl_pathv[i]);
        if (n < 4 || strcmp(g.gl_pathv[i] + n - 4, ".txt") != 0) {
            printf("FAIL ext\n"); return 1;
        }
    }

    globfree(&g);

    /* Cleanup */
    for (int i = 0; i < 4; i++) {
        char buf[128];
        snprintf(buf, sizeof(buf), "%s/%s", dir, files[i]);
        unlink(buf);
    }
    rmdir(dir);
    printf("OK\n");
    return 0;
}
