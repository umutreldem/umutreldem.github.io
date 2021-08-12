#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aPosition;

void main() {

    vec4 positionVec4 = vec4(aPosition, 1.0); // Copy the position data to vec4, adding 1. as w param
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0; // Scale the output to fit the canvas.
    gl_Position = positionVec4;
}