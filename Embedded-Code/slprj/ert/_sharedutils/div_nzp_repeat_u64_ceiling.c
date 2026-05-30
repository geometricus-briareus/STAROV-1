/*
 * Academic License - for use in teaching, academic research, and meeting
 * course requirements at degree granting institutions only.  Not for
 * government, commercial, or other organizational use.
 *
 * File: div_nzp_repeat_u64_ceiling.c
 *
 * Code generated for Simulink model 'baloncuk_rov'.
 *
 * Model version                  : 1.64
 * Simulink Coder version         : 24.2 (R2024b) 21-Jun-2024
 * C/C++ source code generated on : Sun Mar 30 20:30:14 2025
 */

#include "div_nzp_repeat_u64_ceiling.h"
#include "rtwtypes.h"

uint64_T div_nzp_repeat_u64_ceiling(uint64_T numerator, uint64_T denominator,
  uint32_T nRepeatSub)
{
  uint64_T localNumerator;
  uint64_T quotient;
  uint32_T iRepeatSub;
  quotient = numerator / denominator;
  localNumerator = numerator % denominator;
  for (iRepeatSub = 0U; iRepeatSub < nRepeatSub; iRepeatSub++) {
    boolean_T numeratorExtraBit;
    numeratorExtraBit = (localNumerator >= 9223372036854775808ULL);
    localNumerator <<= 1ULL;
    quotient <<= 1ULL;
    if (numeratorExtraBit || (localNumerator >= denominator)) {
      quotient++;
      localNumerator -= denominator;
    }
  }

  if (localNumerator > 0ULL) {
    quotient++;
  }

  return quotient;
}

/*
 * File trailer for generated code.
 *
 * [EOF]
 */
