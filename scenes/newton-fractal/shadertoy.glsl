// Complex math!

#define PI 3.141592653589793238
#define TO_RADIANS 0.01745329251
#define HALF_PI 1.57079633
#define HALF_PI_INV 0.15915494309
#define PI_INV 0.31830988618
#define TWO_PI 6.28318530718

float hypot (vec2 z) {
    float x = abs(z.x);
    float y = abs(z.y);
    float t = min(x, y);
    x = max(x, y);
    t = t / x;
    return x * sqrt(1.0 + t * t);
}

vec2 cadd (vec2 a, vec2 b) {
    return a + b;
}

vec2 csub (vec2 a, vec2 b) {
    return a - b;
}

float cmod (vec2 z) {
    return hypot(z);
}

vec2 csqrt (vec2 z) {
    float t = sqrt(2.0 * (cmod(z) + (z.x >= 0.0 ? z.x : -z.x)));
    vec2 f = vec2(0.5 * t, abs(z.y) / t);

    if (z.x < 0.0) f.xy = f.yx;
    if (z.y < 0.0) f.y = -f.y;

    return f;
}


float cabs (vec2 z) {
    return cmod(z);
}



vec2 cdiv (vec2 a, vec2 b) {
    float e, f;
    float g = 1.0;
    float h = 1.0;

    if( abs(b.x) >= abs(b.y) ) {
        e = b.y / b.x;
        f = b.x + b.y * e;
        h = e;
    } else {
        e = b.x / b.y;
        f = b.x * e + b.y;
        g = e;
    }

    return (a * g + h * vec2(a.y, -a.x)) / f;
}

vec2 cexp(vec2 z) {
    return vec2(cos(z.y), sin(z.y)) * exp(z.x);
}

vec2 cinv (vec2 b) {
    float e, f;
    vec2 g = vec2(1, -1);

    if( abs(b.x) >= abs(b.y) ) {
        e = b.y / b.x;
        f = b.x + b.y * e;
        g.y = -e;
    } else {
        e = b.x / b.y;
        f = b.x * e + b.y;
        g.x = e;
    }

    return g / f;
}

vec2 cmult (vec2 a, vec2 b) {
    return vec2(
    a.x * b.x - a.y * b.y,
    a.y * b.x + a.x * b.y
    );
}

vec2 cmult (vec2 a, vec2 b, vec2 c) {
    return cmult(cmult(a, b), c);
}

vec2 cmult (vec2 a, vec2 b, vec2 c, vec2 d) {
    return cmult(cmult(a, b), cmult(c, d));
}

vec2 cmult (vec2 a, vec2 b, vec2 c, vec2 d, vec2 e) {
    return cmult(cmult(a, b, c), cmult(d, e));
}

vec2 cmult (vec2 a, vec2 b, vec2 c, vec2 d, vec2 e, vec2 f) {
    return cmult(cmult(a, b, c), cmult(d, e, f));
}



vec2 cpow (vec2 z, float x) {
    float r = hypot(z);
    float theta = atan(z.y, z.x) * x;
    return vec2(cos(theta), sin(theta)) * pow(r, x);
}

vec2 cpow (vec2 a, vec2 b) {
    float aarg = atan(a.y, a.x);
    float amod = hypot(a);

    float theta = log(amod) * b.y + aarg * b.x;

    return vec2(
    cos(theta),
    sin(theta)
    ) * pow(amod, b.x) * exp(-aarg * b.y);
}



vec2 toUV(vec2 pixelCoords){
    return vec2(pixelCoords.x/iResolution.x,pixelCoords.y/iResolution.y);
}

vec2 toCoords( vec2 uv ){

    return 30.*(1.001+sin(iTime/5.))*(uv-vec2(0.5));
}



vec2 f( vec2 z ){

    return cmult(z,z,z)-2.*cmult(z,z)+3.;

}

vec2 fPrime( vec2 z ){

    return 3.*cmult(z,z)-4.*z;

}

vec2 newton( vec2 z ){
    vec2 val = f(z);
    vec2 deriv = fPrime(z);
    vec2 adjust = cdiv(val,deriv);

    vec2 z1 = z - adjust;
    return z1;
}

vec2 newtonIteration( vec2 z, int n ){

    for(int i=0; i<n; i++){
        z = newton(z);
    }

    return z;

}




void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 uv = toUV( fragCoord);
    vec2 z = toCoords(uv);

    //run newton's iteration at z:
    vec2 w = newtonIteration(z, 30);

    //map w to a color value:
    //check if we have converged, by applying newton one more time
    vec3 color;
    vec2 v = newton(w);
    if(length(v-w)>0.0001){
        color = vec3(0);
    }
    else{
        //the system has converged: choose a color based on w:
        color = vec3(w.x,w.y,0.);
    }

    //return this to the shader
    fragColor = vec4(color,1);
}
