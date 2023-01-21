import { CONFIG_TOKEN } from 'src/modules/core';
import { Inject } from '@nestjs/common';

export const Config = () => Inject(CONFIG_TOKEN);
