/*
 * Academic License - for use in teaching, academic research, and meeting
 * course requirements at degree granting institutions only.  Not for
 * government, commercial, or other organizational use.
 *
 * File: div_nzp_repeat_s64_floor.c
 *
 * Code generated for Simulink model 'baloncuk_rov'.
 *
 * Model version                  : 1.64
 * Simulink Coder version         : 24.2 (R2024b) 21-Jun-2024
 * C/C++ source code generated on : Sun Mar 30 20:30:14 2025
 */

#include "div_nzp_repeat_s64_floor.h"
#include "div_nzp_repeat_u64.h"
#include "div_nzp_repeat_u64_ceiling.h"
#include "rtwtypes.h"

int64_T div_nzp_repeat_s64_floor(int64_T numerator, int64_T denominator,
  uint32_T nRepeatSub)
{
  int64_T quotient;
  uint64_T absDenominator;
  uint64_T absNumerator;
  absNumerator = (numerator < 0LL) ? (~((uint64_T)/*MW:OvOk*/ numerator) + 1ULL)
    : ((uint64_T)numerator);
  absDenominator = (denominator < 0LL) ? (~((uint64_T)/*MW:OvOk*/ denominator) +
    1ULL) : ((uint64_T)denominator);
  if ((numerator < 0LL) != (denominator < 0LL)) {
    quotient = -/*MW:OvOk*/ ((int64_T)div_nzp_repeat_u64_ceiling(absNumerator,
      absDenominator, nRepeatSub));
  } else {
    quotient = (int64_T)div_nzp_repeat_u64(absNumerator, absDenominator,
      nRepeatSub);
  }

  return quotient;
}

/*
 * File trailer for generated code.
 *
 * [EOF]
 */
