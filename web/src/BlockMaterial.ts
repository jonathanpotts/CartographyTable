import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Scene } from '@babylonjs/core/scene';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import vertexShader from './shaders/BlockShader.vertex.glsl';
import fragmentShader from './shaders/BlockShader.fragment.glsl';

/**
 * A material used for rendering blocks.
 */
export default class BlockMaterial extends ShaderMaterial {
  private cullFaces: Vector3[];

  /**
   * Creates a material for rendering blocks.
   * @param name Name of the material.
   * @param scene Scene to add the material to.
   */
  public constructor(name: string, scene: Scene) {
    super(
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
          'tintColor',
          'shadeColor',
          'cullNormals',
          'cullNormalsCount',
        ],
        needAlphaBlending: true,
      },
    );

    this.setColor4('tintColor', new Color4(1, 1, 1, 1));
    this.setColor4('shadeColor', new Color4(0.98, 0.98, 0.98, 1));

    this.cullFaces = [];
    this.setInt('cullNormalsCount', 0);
  }

  /**
   * Sets a diffuse texture to the material.
   * @param texture Texture to set to the material.
   * @returns The modified material.
   */
  public setDiffuseTexture(texture: BaseTexture): BlockMaterial {
    this.setTexture('textureSampler', texture);
    return this;
  }

  /**
   * Sets a tint color to the material.
   * @param color Color to tint the material.
   * @returns The modified material.
   */
  public setTintColor(color: Color4): BlockMaterial {
    this.setColor4('tintColor', color);
    return this;
  }

  /**
   * Sets a light level to the material.
   * @param light Light level used to shade the material.
   * @returns The modified material.
   */
  public setLightLevel(light: number): BlockMaterial {
    const brightness = light * (0.93 / 15) + 0.05;
    this.setColor4('shadeColor', new Color4(brightness, brightness, brightness, 1));

    return this;
  }

  /**
   * Culls a face using the material.
   * @param face Face to cull with the material.
   * @returns The modified material.
   */
  public addCullFace(face: Vector3): BlockMaterial {
    if (this.cullFaces.length > 6) {
      throw new Error('Too many cull faces have been specified');
    }

    this.cullFaces.push(face);

    const values: number[] = [];
    for (const vec3 of this.cullFaces) {
      values.push(vec3.x, vec3.y, vec3.z);
    }

    this.setArray4('cullNormals', values);
    this.setInt('cullNormalsCount', this.cullFaces.length);

    return this;
  }
}
