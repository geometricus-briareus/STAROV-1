/*
 * Academic License - for use in teaching, academic research, and meeting
 * course requirements at degree granting institutions only.  Not for
 * government, commercial, or other organizational use.
 *
 * File: asr_s64.c
 *
 * Code generated for Simulink model 'baloncuk_rov'.
 *
 * Model version                  : 1.64
 * Simulink Coder version         : 24.2 (R2024b) 21-Jun-2024
 * C/C++ source code generated on : Sun Mar 30 20:30:14 2025
 */

#include "asr_s64.h"
#include "rtwtypes.h"

int64_T asr_s64(int64_T u, uint32_T n)
{
  int64_T y;
  if (u >= 0LL) {
    y = (int64_T)((uint64_T)((uint64_T)u >> n));
  } else {
    y = -((int64_T)((uint64_T)((uint64_T)((int64_T)(-1LL - u)) >> n))) - 1LL;
  }

  return y;
}

/*
 * File trailer for generated code.
 *
 * [EOF]
 */
