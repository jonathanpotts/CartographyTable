attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 worldViewProjection;

varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);

  vNormal = normal;
  vUV = uv;
}
