import { roomRepository } from './roomRepository';
import { blockRepository } from './blockRepository';
import { controlRepository } from './controlRepository';

/**
 * Facade unificada dos repositórios da API Litúrgica.
 * Agrupa operações de sala, blocos e controle da mesa.
 */
export const liturgicalRepository = {
  ...roomRepository,
  ...blockRepository,
  ...controlRepository,
};
