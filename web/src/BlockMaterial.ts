import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Scene } from '@babylonjs/core/scene';
import { Vector4 } from '@babylonjs/core/Maths/math.vector';
import vertexShader from './shaders/BlockShader.vertex.glsl';
import fragmentShader from './shaders/BlockShader.fragment.glsl';

export default class BlockMaterial {
  public static create(name: string, scene: Scene): ShaderMaterial {
    const material = new ShaderMaterial(
      name,
      scene,
      {
        vertexSource: vertexShader,
        fragmentSource: fragmentShader,
      },
      {
        attributes: [
          'position',
          'normal',
          'uv',
        ],
        uniforms: [
          'worldViewProjection',
          'textureSampler',
          'numberOfCullNormals',
          'cullNormals',
          'tintColor',
          'shadeColor',
        ],
        needAlphaBlending: true,
      },
    );

    material.setInt('numberOfCullNormals', 0);
    material.setVector4('tintColor', new Vector4(1, 1, 1, 1));
    material.setVector4('shadeColor', new Vector4(1, 1, 1, 1));

    return material;
  }
}
