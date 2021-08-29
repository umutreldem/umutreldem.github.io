#ifdef GL_ES
precision highp float;
#endif



uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec4 Area; // Four values -> X & Y starting positions + size of area 
uniform float Angle; // For rotation
uniform sampler2D tex0; // Color values



vec2 nearest(vec2 uv, vec2 res) {

    return floor(uv * (res - 1.)) / (res - 1.);

}


vec2 rot(vec2 p, vec2 pivot, float a) {
    
    float s = sin(a);
    float c = cos(a);

    p -= pivot;
    p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);
    p += pivot;

    return p;
}

void main() {


    vec2 st = gl_FragCoord.xy/u_resolution;

    vec2 c = Area.xy + (st.xy - 0.5) * Area.zw; // Have to subtract 1. from st.xy (*not* 0.5!)
    c = rot(c, Area.xy, Angle);

    vec2 z = vec2(0, 0); 
    float result = 0.;

    for(float iter = 0.; iter < 500.; iter++) {
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + c;
        result = iter;
        if(length(z) > 2.) break;
    }

    if(result >= 254. || result <= 20.) {

            gl_FragColor = vec4(0., 0., 0., 1.);

    } else {

    float nResult = result / 255.;
    
    vec2 res = vec2(5, 1);
    vec2 finCoord = vec2(mod(nResult * 1.5, 1.), 0.);

    //finCoord = nearest(finCoord, res);

    vec4 color = texture2D(tex0, finCoord);  // vec4 color = texture2D(tex0, vec2((nResult * 1.), 0.)); 
    

    gl_FragColor = color;

    }

} 