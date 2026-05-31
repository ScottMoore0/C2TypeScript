/* Hand-rolled atof (simplified). */
#include <stdio.h>
#include <ctype.h>
double my_atof(const char *s) {
  while (isspace((unsigned char)*s)) s++;
  int sign = 1;
  if (*s == '-') { sign = -1; s++; }
  else if (*s == '+') s++;
  double n = 0.0;
  while (isdigit((unsigned char)*s)) { n = n * 10 + (*s - '0'); s++; }
  if (*s == '.') {
    s++;
    double frac = 0.1;
    while (isdigit((unsigned char)*s)) { n += (*s - '0') * frac; frac *= 0.1; s++; }
  }
  return sign * n;
}
int main(void) {
  printf("%.3f %.3f %.3f\n", my_atof("3.14"), my_atof("-2.5"), my_atof("0.125"));
  return 0;
}
