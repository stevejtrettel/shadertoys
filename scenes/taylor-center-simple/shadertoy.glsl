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



//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
    6.0)-3.0)-1.0,
    0.0,
    1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}



// signed distance to a 2D triangle
float sdTriangle( in vec2 p, in vec2 p0, in vec2 p1, in vec2 p2 )
{
    vec2 e0 = p1 - p0;
    vec2 e1 = p2 - p1;
    vec2 e2 = p0 - p2;

    vec2 v0 = p - p0;
    vec2 v1 = p - p1;
    vec2 v2 = p - p2;

    vec2 pq0 = v0 - e0*clamp( dot(v0,e0)/dot(e0,e0), 0.0, 1.0 );
    vec2 pq1 = v1 - e1*clamp( dot(v1,e1)/dot(e1,e1), 0.0, 1.0 );
    vec2 pq2 = v2 - e2*clamp( dot(v2,e2)/dot(e2,e2), 0.0, 1.0 );

    float s = e0.x*e2.y - e0.y*e2.x;
    vec2 d = min( min( vec2( dot( pq0, pq0 ), s*(v0.x*e0.y-v0.y*e0.x) ),
    vec2( dot( pq1, pq1 ), s*(v1.x*e1.y-v1.y*e1.x) )),
    vec2( dot( pq2, pq2 ), s*(v2.x*e2.y-v2.y*e2.x) ));

    return -sqrt(d.x)*sign(d.y);
}




vec2 toZ(vec2 frag){

    //to (-1,1)x(1,1)
    vec2 z = 2.*frag/iResolution.xy;
    z -= vec2(1);

    //adjust by scale
    float scale = 4.;
    z *= scale;

    //fix aspect ratio
    z*= vec2(1,iResolution.y/iResolution.x);

    return z;
}


vec2 f(vec2 z, vec2 a){

    //make the talyor series for 1/z centered at "a"
    //this is (-1/a) sum ((z+a)/a)^n

    int N=300;

    //we are doing domain coloring, switch the sign of a
    //as we are "subtracting instead of adding"
    a=-a;

    vec2 w = vec2(0,0);
    vec2 temp = vec2(1,0);
    vec2 diff = cdiv(z+a,a);
    for(int i=0;i<N;i++){
        w+=temp;
        temp=cmult(temp,diff);
    }
    return cdiv(-w,a);
}


float grid(vec2 uv, float size){

    float brightness = 1./(5.*sqrt(size));

    float gridPattern = abs(sin(3.14*size*uv.x)*sin(1.*3.14*size*uv.y));

    //invert and increase contrast:
    gridPattern = 1.-pow(gridPattern,0.05);

    return gridPattern*brightness;
}


vec3 gridColor(vec2 w){

    float x = w.x;
    float y = w.y;
    float theta = atan(y,x);

    float grid1 = grid(w,1.);
    float grid2 = grid(w,5.);
    float grid3 = grid(w,10.);
    float grid4 = grid(w,50.);
    float grid5 = grid(w,250.);
    float grid = grid1+grid2+grid3+grid4+grid5;
    grid *=4.;

    vec3 base = hsb2rgb(vec3(theta/6.28,0.5,0.8-grid));
    base += vec3(0.1);

    return base + 2.*vec3(grid);

}

vec3 pointColor(vec2 z,vec2 a){
    if(length(z-a)<0.1){
        return vec3(0,1,0);
    }
    return vec3(0,0,0);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 z = toZ(fragCoord);

    vec2 a = toZ(iMouse.xy);
    //vec2 a = vec2(2.*sin(iTime),0.5*cos(iTime));

    //get the result of applying the taylor series
    vec2 w = f(z,a);

    vec3 col;
    col += pointColor(z,a);
    col += gridColor(w);
    if(length(w)>1000.){
        col=vec3(0,0,0);
    }


    // Output to screen
    fragColor = vec4(col,1.0);
}
