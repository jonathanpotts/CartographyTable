uniform sampler2D diffuse;
uniform vec4 tintColor;
uniform vec4 shadeColor;
uniform vec3 cullNormals[6];
uniform int cullNormalsCount;

varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  for (int i = 0; i < cullNormalsCount; i++) {
    if (distance(vNormal, cullNormals[i]) < 0.1) {
      discard;
    }
  }

  vec4 color = texture2D(diffuse, vUV);
  color *= tintColor;
  color *= shadeColor;

  gl_FragColor = color;
}
