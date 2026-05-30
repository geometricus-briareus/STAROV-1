#include <stdint.h>
#include <stdbool.h>
#ifndef MATLAB_MEX_FILE
#include "stm32f4xx_hal.h"

extern UART_HandleTypeDef huart2;
#endif

bool bno08x_rvc_usart2_hal(uint8_t* received)
{
#ifndef MATLAB_MEX_FILE
    if (HAL_UART_Receive(&huart2, received, 19, 5) == HAL_OK)
        return true;
    else
        return false;
#endif
}
