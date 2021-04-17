uniform sampler2D textureSampler;
uniform mat4 textureMatrix;
uniform int numberOfCullNormals;
uniform vec3 cullNormals[6];
uniform vec4 tintColor;
uniform vec4 shadeColor;

varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  for (int i = 0; i < numberOfCullNormals; i++) {
    if (distance(vNormal, cullNormals[i]) < 0.1) {
      discard;
    }
  }

  vec4 color = texture2D(textureSampler, vUV);
  color *= tintColor;
  color *= shadeColor;
  gl_FragColor = color;
}
