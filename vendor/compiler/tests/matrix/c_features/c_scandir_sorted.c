/* POSIX.1-2017 §5.1.2 scandir(3) with alphasort comparator.
 *
 * Creates three files in a scratch dir and verifies scandir returns them in
 * ASCII-sorted order. Relay binding: fs.scandir with compare="alphasort".
 */
#include <stdio.h>
#include <stdlib.h>
#include <dirent.h>
#include <sys/stat.h>
#include <unistd.h>
#include <string.h>

int main(void) {
    const char *dir = "scan_scratch";
    mkdir(dir, 0755);

    /* Create a.txt, b.txt, c.txt in non-sorted creation order. */
    const char *names[] = { "c.txt", "a.txt", "b.txt" };
    for (int i = 0; i < 3; i++) {
        char buf[128];
        snprintf(buf, sizeof(buf), "%s/%s", dir, names[i]);
        FILE *f = fopen(buf, "w");
        if (!f) { printf("FAIL fopen\n"); return 1; }
        fclose(f);
    }

    struct dirent **entries = NULL;
    int n = scandir(dir, &entries, NULL, alphasort);
    if (n < 0) { printf("FAIL scandir\n"); return 1; }

    /* Expect to see a.txt before b.txt before c.txt (ignoring "." / ".."). */
    int seen_a = -1, seen_b = -1, seen_c = -1;
    for (int i = 0; i < n; i++) {
        if (strcmp(entries[i]->d_name, "a.txt") == 0) seen_a = i;
        else if (strcmp(entries[i]->d_name, "b.txt") == 0) seen_b = i;
        else if (strcmp(entries[i]->d_name, "c.txt") == 0) seen_c = i;
        free(entries[i]);
    }
    free(entries);

    if (seen_a < 0 || seen_b < 0 || seen_c < 0) { printf("FAIL missing\n"); return 1; }
    if (!(seen_a < seen_b && seen_b < seen_c)) { printf("FAIL order\n"); return 1; }

    /* Cleanup */
    for (int i = 0; i < 3; i++) {
        char buf[128];
        snprintf(buf, sizeof(buf), "%s/%s", dir, names[i]);
        unlink(buf);
    }
    rmdir(dir);
    printf("OK\n");
    return 0;
}
