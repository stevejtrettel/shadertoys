vec2 complexMult(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

float testJulia(vec2 coord,vec2 mouse) {

    const int iterations = 100;
    vec2 testPoint = coord;
    for (int i = 0; i < iterations; i++){
        testPoint = complexMult(testPoint,testPoint) + mouse;
        float ndot = dot(testPoint,testPoint);
        if (ndot > 45678.0) {
            float sl = float(i) - log2(log2(ndot))+4.0;
            return sl/float(iterations);
        }
    }
    return 0.0;
}

vec4 mapColor(float mcol) {
    if(mcol==0.){return vec4(0,0,0,1);}
    vec3 color = (1.-mcol)*vec3(1);
    return vec4(color,1);
    //return vec4(0.5 + 0.5*cos(2.7+mcol*30.0 + vec3(0.0,.6,1.0)),1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 aspect = vec2(1,iResolution.y/iResolution.x);
    vec2 fragment = fragCoord/iResolution.xy - vec2(0.5);
    vec2 uv = 5.0 * aspect * fragment;

    //vec2 pos = 5.0*aspect*(iMouse.xy/iResolution.xy - vec2(0.5));
    //2.0*iMouse.xy/iResolution.xy -1.0;

    // vec2 pos = vec2(-0.5+2.*cos(iTime/10.),sin(2.*iTime));
    // vec2 pos = 0.5*(sin(iTime/5.))*vec2(cos(2.*iTime)-0.3,sin(iTime));
    vec2 pos = vec2(-0.8,0.1+0.1*sin(iTime));

    fragColor = mapColor(testJulia(uv,pos));

    if(length(uv-pos)<0.05){
        fragColor = vec4(1,0,0,1);
    }
}
