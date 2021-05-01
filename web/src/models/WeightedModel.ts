import { Mesh } from '@babylonjs/core';

/**
 * A weighted model.
 */
interface WeightedModel {
  /**
   * Weight of the model.
   */
  weight: number;

  /**
   * Model.
   */
  model: Mesh;
}

export default WeightedModel;
