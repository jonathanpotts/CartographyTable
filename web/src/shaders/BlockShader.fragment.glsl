uniform sampler2D diffuse;
uniform vec4 tintColor;
uniform vec4 shadeColor;

varying vec2 vUV;

void main(void) {
  vec4 color = texture2D(diffuse, vUV);
  // color *= tintColor;
  // color *= shadeColor;

  gl_FragColor = color;
}
