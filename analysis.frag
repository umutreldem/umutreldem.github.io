

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 Color1; // Color values
uniform vec3 Color2;
uniform vec3 Color3;
uniform vec3 Color4;
uniform vec3 Color5;
uniform sampler2D tex0; // Mandelbrot shader to analyze

vec3 rgb2lab(vec3 col) {

    float r = (col.r > 0.04045) ? pow((col.r + 0.055) / 1.055, 2.4) : col.r / 12.92;
    float g = (col.g > 0.04045) ? pow((col.g + 0.055) / 1.055, 2.4) : col.g / 12.92;
    float b = (col.b > 0.04045) ? pow((col.b + 0.055) / 1.055, 2.4) : col.b / 12.92;

    float x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    float y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    float z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = (x > 0.008856) ? pow(x, 1./3.) : (7.787 * x) + 16./116.;
    y = (y > 0.008856) ? pow(y, 1./3.) : (7.787 * y) + 16./116.;
    z = (z > 0.008856) ? pow(z, 1./3.) : (7.787 * z) + 16./116.;

    return vec3((116. * y) - 16., 500. * (x - y), 200. * (y - z));

}

float deltaE(vec3 labA, vec3 labB) { // Returns value between 0. - 100.

    float deltaL = labA.x - labB.x;
    float deltaA = labA.y - labB.y;
    float deltaB = labA.z - labB.z;

    float c1 = sqrt(labA.y * labA.y + labA.z * labA.z);
    float c2 = sqrt(labB.y * labB.y + labB.z * labB.z);

    float deltaC = c1 - c2;
    float deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0. ? 0. : sqrt(deltaH);

    float sc = 1. + 0.045 * c1;
    float sh = 1. + 0.015 * c1;

    float deltaLKlsl = deltaL / 1.;
    float deltaCkcsc = deltaC / sc;
    float deltaHkhsh = deltaH / sh;

    float i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;

    return i < 0. ? 0. : sqrt(i);

}

// float deltaE(vec3 col1, vec3 col2) { // rgb -> LAB -> deltaE
  
// }

bool isBlack(vec3 col) {
    
    return (col.r + col.g + col.b) / 3. <= 0.;

}

void main() {

    vec2 st = gl_FragCoord.xy/u_resolution;
    float stepX = 1./u_resolution.x;
    float stepY = 1./u_resolution.y;

    vec4 color = texture2D(tex0, st);
    vec3 colorLAB = rgb2lab(color.rgb);

    float d1 = 0.;
    float d2 = 0.;
    float d3 = 0.;
    float d4 = 0.;
    float d5 = 0.;

    float thisCol = 0.;
    float thisNeigh = 0.;

    if(!isBlack(color.rgb)) { // If the pixel has a color-

        // FIRST STEP: Which one of the five colors is the individual pixel?
        d1 = deltaE(colorLAB, Color1);
        d2 = deltaE(colorLAB, Color2);
        d3 = deltaE(colorLAB, Color3);
        d4 = deltaE(colorLAB, Color4);
        d5 = deltaE(colorLAB, Color5);

        float i = 0.;
        float curValue = d1;

        if(d2 < curValue) {
            curValue = d2;
            i = 1.;
        } 
        
        if(d3 < curValue) {
            curValue = d3;
            i = 2.;
        }

        if(d4 < curValue) {
            curValue = d4;
            i = 3.;
        }

        if(d5 < curValue) {
            curValue = d5;
            i = 4.;
        }

        // if(i == 0.) {
        //     result = 0.1;
        // } else if(i == 1.) {
        //     result = 0.2;
        // } else if(i == 2.) {
        //     result = 0.3;
        // } else if(i == 3.) {
        //     result = 0.4;
        // } else if(i == 4.) {
        //     result = 0.5;
        // } else {
        //     result = 1.;
        // }

        thisCol = (i * 0.1) + 0.1; // If closest is Color1 -> 0.1, Color2 -> 0.2, etc.



        //STEP TWO: What kind of neighbors does it have?
        vec4 nLeft = texture2D(tex0, vec2(st.x - stepX, st.y));
        vec4 nRight = texture2D(tex0, vec2(st.x + stepX, st.y));
        vec4 nUp = texture2D(tex0, vec2(st.x, st.y + stepY));
        vec4 nDown = texture2D(tex0, vec2(st.x, st.y - stepY));

        if(isBlack(nLeft.rgb) || isBlack(nRight.rgb) || isBlack(nUp.rgb) || isBlack(nDown.rgb)) {  
            thisNeigh = 0.1; // First State (EMPTY BORDER)
        } else if(color.rgb == nLeft.rgb && color.rgb == nRight.rgb && color.rgb == nUp.rgb && color.rgb == nDown.rgb) {
            thisNeigh = 0.2; // Second State (FILL)
        } else {
            thisNeigh = 0.3; // Third State (MIXED or GRADIENT)
        }

    }

    gl_FragColor = vec4(thisCol, thisNeigh, 0., 0.);

}