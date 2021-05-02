import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Scene } from '@babylonjs/core/scene';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import Constants from './Constants';
import vertexShader from './shaders/BlockShader.vertex.glsl';
import fragmentShader from './shaders/BlockShader.fragment.glsl';

/**
 * A material used for rendering blocks.
 */
export default class BlockMaterial extends ShaderMaterial {
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
          'uv',
        ],
        uniforms: [
          'worldViewProjection',
          'diffuse',
          'tintColor',
          'shadeColor',
        ],
        needAlphaBlending: true,
      },
    );

    this.setColor4('tintColor', Color3.White().toColor4());
    this.setColor4('shadeColor',
      new Color4(Constants.MAX_BRIGHTNESS, Constants.MAX_BRIGHTNESS, Constants.MAX_BRIGHTNESS, 1));
  }

  /**
   * Sets a diffuse texture to the material.
   * @param texture Texture to set to the material.
   * @returns The modified material.
   */
  public setDiffuseTexture(texture: BaseTexture): BlockMaterial {
    this.setTexture('diffuse', texture);
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
    const brightnessScalar = (Constants.MAX_BRIGHTNESS - Constants.OVERWORLD_MIN_BRIGHTNESS)
      / Constants.MAX_LIGHT_LEVEL + Constants.OVERWORLD_MIN_BRIGHTNESS;
    const brightness = light * brightnessScalar;
    this.setColor4('shadeColor', new Color4(brightness, brightness, brightness, 1));
    return this;
  }
}
