#define L2(x)           dot(x, x)
#define MAX_ITER        3000


bool doHalfPlane = true;

const vec2[] PARAMS = vec2[] (
vec2(1.8462756, 0.09627581),
vec2(1.958591, 0.011278),
vec2(1.857382, 0.076258),
vec2(1.64213876, 0.76658841),
vec2(1.658312, 0.5),
vec2(1.926434053, 0.027381792),
vec2(2, 0)
);

const int NUM_PARAMS = PARAMS.length();

float wrap(in float x, in float a, in float s) {
    return mod(x - s, a) + s;
}

vec2 transA(in vec2 z, float a, float b, inout float scale) {
    float k = 1. / dot(z, z);
    z *= k;
    scale *= k;
    z.x -= b;
    z.y = a - z.y;
    return z;
}

bool separation(in vec2 z, in float a, in float b) {
    float f = (z.x >= -b/2.0) ? 1.0 : -1.0;
    float K = sign(b) * (2.0*a - 1.95) / 4.3;
    float M = 7.2 - (1.95 - a) * 18.0;
    return z.y >= 0.5*a + K*f*(1.0 - exp(-M*abs(z.x + b * 0.5)));
}

float kleinian(in vec2 z, vec2 pattern, float scale) {
    float a = pattern.x, b = pattern.y;
    float f = sign(b);
    vec2 lz = z + vec2(1), llz = z - vec2(1);
    for (int i = 0; i < MAX_ITER; i++) {
        z.x = z.x + f * b / a * z.y;
        z.x = wrap(z.x, 2.0, -1.0);
        z.x = z.x - f * b / a * z.y;

        if (separation(z, a, b)) {
            z = vec2(-b, a) - z;
        }

        z = transA(z, a, b, scale);

        // If the iterated points enters a 2-cycle, bail out.
        if (dot(z-llz, z-llz) < 1e-6) {
            return abs(z.y)  / scale;
        }

        // If the iterated point gets outside z.y=0 and z.y=a, bail out.
        if (z.y < 0.0)
        return -z.y/scale;
        if (z.y > a)
        return (z.y - a)/scale;

        llz=lz; lz=z;
    }
    return 1e3;
}


vec3 hsv2rgb(vec3 c) {
    const vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 postprocess(vec3 col, vec2 q) {
    col = pow(clamp(col, 0.0, 1.0), vec3(1.0/2.2));
    col = col*0.6 + 0.4*col*col*(3.0 - 2.0*col);
    col = mix(col, vec3(dot(col, vec3(0.33))), -0.4);
    col *= 0.5 + 0.5*pow(19.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.7);
    return col;
}

vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2. * fragCoord - iResolution.xy) / iResolution.y;

    const float zoom = 1.;
    //3.;

   // float time = mod(0.2*iTime, float(NUM_PARAMS));
    float time = 6.3;
    //6.+mod(0.1*iTime,1.);
    int it = int(floor(time));
    float ft = fract(time);
    vec2 pattern = mix(PARAMS[it], PARAMS[(it+1) % NUM_PARAMS], smoothstep(0., 1., ft));
    float scale = 1.2;
    vec2 p = uv * 1.1;

    if (doHalfPlane) {
        p.y += 1.0;
        p *= 0.5*pattern.x;
    }
    else {
        p -= vec2(0, -1);
        float r2 = 2. / dot(p, p);
        p *= r2;
        scale *= r2;
        p += vec2(0, -1);
    }
    float aa = 2. / iResolution.y;

    float d = zoom * kleinian(p, pattern, scale);

    float b = -0.125;
    float t = 1.0;
    const float lh = 1.25;
    const vec3 lp1 = vec3(.5, .5, lh);
    const vec3 lp2 = vec3(-0.5, .5, lh);

    vec3 ro = vec3(0, 0, t);
    vec3 pp = vec3(p, 0);

    vec3 rd = normalize(pp - ro);

    vec3 ld1 = normalize(lp1 - pp);
    vec3 ld2 = normalize(lp2 - pp);

    float bt = -(t-b)/rd.z;

    vec3  bp   = ro + bt*rd;
    vec3  srd1 = normalize(lp1 - bp);
    vec3  srd2 = normalize(lp2 - bp);
    float bl21 = L2(lp1 - bp);
    float bl22 = L2(lp2 - bp);

    float st1 = (0.0-b)/srd1.z;
    float st2 = (0.0-b)/srd2.z;
    vec3  sp1 = bp + srd1*st1;
    vec3  sp2 = bp + srd2*st1;

    float bd = zoom * kleinian(bp.xy, pattern, scale);
    float sd1= zoom * kleinian(sp1.xy, pattern, scale);
    float sd2= zoom * kleinian(sp2.xy, pattern, scale);

    vec3 col = vec3(0.0);
    //a parameter controlling softness of shadows
    const float ss = 50.0;

    //the two shadows: and the brightness from light source in background
    col       += vec3(1)  * (1.0 - exp(-ss*(max(sd1, 0.0)))) / bl21;
    col       += vec3(.5) * (1.0 - exp(-ss*(max(sd2, 0.0)))) / bl22;

    float l   = length(p);
    float hue = fract(0.75*l-0.3*iTime) + .5;
    float sat = tanh(2.*l);
    vec3 hsv  = vec3(hue, sat, 0.5);
    vec3 bcol = hsv2rgb(hsv);
    //pal( p.x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.90,0.30) );
   // hsv2rgb(hsv);


    col       *= (1.0-tanh(0.5*l))*0.5;
    col       = mix(col, bcol, smoothstep(-aa, aa, -d));

    //adding the brightness glow
    col       += 0.5*sqrt(bcol.zxy)*(exp(-(10.0+100.0*tanh(l))*max(d, 0.0)));

    col = postprocess(col, fragCoord/iResolution.xy);
    fragColor = vec4(col,1.0);
}