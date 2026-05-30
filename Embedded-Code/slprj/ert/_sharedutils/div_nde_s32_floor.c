/*
 * Academic License - for use in teaching, academic research, and meeting
 * course requirements at degree granting institutions only.  Not for
 * government, commercial, or other organizational use.
 *
 * File: div_nde_s32_floor.c
 *
 * Code generated for Simulink model 'baloncuk_rov'.
 *
 * Model version                  : 1.79
 * Simulink Coder version         : 24.2 (R2024b) 21-Jun-2024
 * C/C++ source code generated on : Wed Apr 23 23:58:53 2025
 */

#include "div_nde_s32_floor.h"
#include "rtwtypes.h"

int32_T div_nde_s32_floor(int32_T numerator, int32_T denominator)
{
  return (int32_T)((((numerator < 0) != (denominator < 0)) && ((numerator %
    denominator) != 0)) ? -1 : 0) + (numerator / denominator);
}

/*
 * File trailer for generated code.
 *
 * [EOF]
 */
