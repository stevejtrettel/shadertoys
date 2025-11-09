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





//take in the fragCoord on the screen and output the desired complex number
//z that you want to be shown at that point:
vec2 toZ(vec2 frag){

    //to (-1,1)x(1,1)
    vec2 z = 2.*frag/iResolution.xy;
    z -= vec2(1);

    //adjust by scale (zoom in/out as you please)
    float scale = 4.;
    z *= scale;

    //fix aspect ratio
    z*= vec2(1,iResolution.y/iResolution.x);

    return z;
}


vec2 f(vec2 z, vec2 a){

    //the talyor series for 1/z centered at "a"
    //is (-1/a) sum ((z+a)/a)^n

    //the taylor series for 1/1+z centered at "a"
    // is (-1/1+a) sum ((z+a)/(1+a))^n

    int N=300;

    //we are doing domain coloring, switch the sign of a
    //as we are "subtracting instead of adding"
    //(precompose with the inverse of the isometry for the right action)
    a=-a;

    //the second singularity
    vec2 s = vec2(2,0);

    vec2 w1 = vec2(0,0);
    vec2 w2 = vec2(0,0);

    vec2 temp1 = vec2(1,0);
    vec2 diff1 = cdiv(z+a,a);

    vec2 temp2 = vec2(1,0);
    vec2 diff2 = cdiv(z+a,s+a);

    for(int i=0;i<N;i++){

        w1+=temp1;
        temp1=cmult(temp1,diff1);

        w2+=temp2;
        temp2=cmult(temp2,diff2);
    }

    vec2 final1 = cdiv(-w1,a);
    vec2 final2 = cdiv(-w2,s+a);

    return final1+final2;
}


//at a point w of the complex plane, what color should we make it?
//this function colors the plane as a grid, with hue depending on angle
// and regular grids along the xy directions
vec3 gridColor(vec2 w){

    float x = w.x;
    float y = w.y;
    float theta = atan(y,x);


    float grid1 = (1.-pow(abs(sin(3.14*x)*sin(1.*3.14*y)),0.1))/10.;
    float grid2 = (1.-pow(abs(sin(5.*3.14*x)*sin(5.*3.14*y)),0.1))/25.;
    float grid3 = (1.-pow(abs(sin(10.*3.14*x)*sin(10.*3.14*y)),0.1))/50.;
    float grid = grid1+grid2+grid3;
    grid *=4.;

    vec3 base = hsb2rgb(vec3(theta/6.28,0.5,0.8-grid));
    base += vec3(0.1);

    return base + 2.*vec3(grid);

}


//draw a circle of radius 0.1 around the point z=a.
vec3 pointColor(vec2 z,vec2 a){
    if(length(z-a)<0.1){
        return vec3(0,1,0);
    }
    return vec3(0,0,0);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    //compute the complex number you want to draw at a given pixel
    vec2 z = toZ(fragCoord);
    //compute the complex number corresponding to your mouse's location
    vec2 a = toZ(iMouse.xy);

    //get the result of applying the taylor series
    vec2 w = f(z,a);

    //color the screen using this information:
    vec3 col;
    //color the center point of the circle where your mouse is
    col += pointColor(z,a);
    //color the plane based on the output w=f(z)
    col += gridColor(w);
    //if the output of the function is large (greater than 1000 in magnitude)
    //just color black as the taylor series is diverging.
    if(length(w)>1000.){
        col=vec3(0,0,0);
    }


    // Output to screen
    fragColor = vec4(col,1.0);
}
