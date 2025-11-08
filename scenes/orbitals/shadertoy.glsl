#define SELECT_GRID 10.0
void get_nlm(out int n, out int l, out int m, in vec2 fragCoord) {
    vec2 mouse = iMouse.xy/iResolution.xy;
    int t;

    bool selection = false;
    if (mouse.x + mouse.y > 0.0) {// && iMouse.z > 0.5) {
        vec2 coord = iMouse.xy;
        ivec2 cell = ivec2(coord/iResolution.y*SELECT_GRID);
        t = cell.x;
        n = cell.y + 1;
        selection = t < n*(n+1)/2 || iMouse.z > 0.5;
    }
    if (!selection) {
        t = int(iTime*0.5);

        if (t == 0)
        n = 1;
        else {
            float x = float(t);
            // see https://en.wikipedia.org/wiki/Tetrahedral_number
            n = int(ceil(pow(3.*x+sqrt(9.*x*x-1./27.), 1./3.) + pow(3.*x-sqrt(9.*x*x-1./27.), 1./3.) - 0.995));
        }
        t -= ((n*(n-1)*(2*n-1))/6+(n*(n-1))/2)/2;
    }

    l = int(floor(sqrt(0.25 + float(2*t)) - 0.5));
    m = t - int(floor(0.5*float(l + l*l)));
}




//--------------------------------------------------------------------
//RANDOM NUMBER STUFF, (FOR POSTPROCESSING)
//--------------------------------------------------------------------



//a global variable which will get passed around
//as a seed for the random number generators.
uint seed;


//--- the function we call in main() which sets seed
uint randomSeed(vec2 fCoord,float frame){

    uint seed = uint(uint(fCoord.x) * uint(1973) + uint(fCoord.y) * uint(925277) + uint(frame) * uint(26699)) | uint(1);
    return seed;

}


//hash function that gets us our random numbers
uint wang_hash(inout uint seed)
{
    seed = uint(seed ^ uint(61)) ^ uint(seed >> uint(16));
    seed *= uint(9);
    seed = seed ^ (seed >> 4);
    seed *= uint(0x27d4eb2d);
    seed = seed ^ (seed >> 15);
    return seed;
}


//return a random float in the interval [0,1]
float randomFloat(inout uint seed){
    return float(wang_hash(seed)) / 4294967296.0;
}




//POSTPROCESSING FOR FILM LOOK
vec3 ACESFilm(vec3 x){
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return (x*(a*x+b))/(x*(c*x+d)+e);
}






//--------------------------------------------------------------------
//BASIC MATH FUNCTIONALITY
//--------------------------------------------------------------------

#define PI 3.14159265359

/*** math heavy part for spherical harmonics ***/

#define SQRT2PI 2.506628274631

// factorial
float fac(int n) {
    float res = 1.0;
    for (int i = n; i > 1; i--)
    res *= float(i);
    return res;
}

// double factorial
float dfac(int n) {
    float res = 1.0;
    for (int i = n; i > 1; i-=2)
    res *= float(i);
    return res;
}

// fac(l-m)/fac(l+m) but more stable
float fac2(int l, int m) {
    int am = abs(m);
    if (am > l)
    return 0.0;
    float res = 1.0;
    for (int i = max(l-am+1,2); i <= l+am; i++)
    res *= float(i);
    if (m < 0)
    return res;
    return 1.0 / res;
}

// complex exponential
vec2 cexp(vec2 c) {
    return exp(c.x)*vec2(cos(c.y), sin(c.y));
}

// complex multiplication
vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

// complex conjugation
vec2 conj(vec2 c) { return vec2(c.x, -c.y); }

// complex/real magnitude squared
float sqr(float x) { return x*x; }
float sqr(vec2 x) { return dot(x,x); }


//smooth functions
float spos(float x, float s) {
    return 0.5*(x*x/(s+abs(x))+x+s);
}
float smax(float a, float b, float s) {
    return a+spos(b-a,s);
}


//rotation about the x axis
vec3 rotateX(vec3 pos, float angle) {
    return vec3(pos.x, cmul(pos.yz, cexp(vec2(0.,-angle))));
}







//--------------------------------------------------------------------
//MATH TO DEFINE THE HYDROGEN ORBITALS
//--------------------------------------------------------------------


// associated legendre polynomials
float legendre_poly(float x, int l, int m) {
    if (l < abs(m))
    return 0.0;
    if (l == 0)
    return 1.0;
    float mul = m >= 0 ? 1.0 : float((~m&1)*2-1)*fac2(l,m);
    m = abs(m);
    // recursive calculation of legendre polynomial
    float lp1 = 0.0;
    float lp2 = float((~m&1)*2-1)*dfac(2*m-1)*pow(max(1.0-x*x, 1e-7), float(m)/2.0);
    for (int i = m+1; i <= l; i++) {
        float lp = (x*float(2*i-1)*lp2 - float(i+m-1)*lp1)/float(i-m);
        lp1 = lp2; lp2 = lp;
    }
    return lp2 / mul;
}

// spherical harmonics function
vec2 sphere_harm(float theta, float phi, int l, int m) {
    float abs_value = 1.0/SQRT2PI*sqrt(float(2*l+1)/2.0*fac2(l,m))
    *legendre_poly(cos(theta), l, m);
    return cexp(vec2(0.0,float(m)*phi))*abs_value;
}

// associated laguerre polynomial L_s^k(x) with k > 0, s >= 0
float laguerre_poly(float x, int s, int k) {
    if (s <= 0)
    return 1.0;
    float lp1 = 1.0;
    float lp2 = 1.0 - x + float(k);
    for (int n = 1; n < s; n++) {
        float lp = ((float(2*n + k + 1) - x) * lp2 - float(n+k)*lp1)/float(n+1);
        lp1 = lp2; lp2 = lp;
    }
    return lp2;
}

// radius dependent term of the 1/r potential eigenstates in atomic units
float radius_term(float r, int n, int l) {
    float a0 = 1.0; // atomic radius
    float rr = r / a0;
    float n2 = 2.0 / float(n) / a0;
    float n3 = n2 * n2 * n2;
    float p1 = sqrt(n3 * fac2(n, l) * float(n-l)/float(n));
    float p2 = exp(-rr/float(n));
    float p3 = pow(n2*r, float(l));
    float p4 = laguerre_poly(n2*r, n-l-1, 2*l+1);
    return p1 * p2 * p3 * p4;
}

vec2 hydrogen(vec3 pos, int n, int l, int m) {
    float r = length(pos);
    float sin_theta = length(pos.xy);
    float phi = sin_theta > 0.0 ? atan(pos.x, pos.y) : 0.0;
    float theta = atan(sin_theta, pos.z);//atan(sin_theta, pos.z);

    return sphere_harm(theta, phi, l, m) * radius_term(r, n, l);
}




//--------------------------------------------------------------------
//DENSITY FUNCTION
//--------------------------------------------------------------------


#define SURFACE_LEVEL 0.4
float density(vec3 pos, in vec2 fragCoord){

    int n, m, l;
    get_nlm(n, l, m, fragCoord);

    float zoomFactor = float(n*n+1)*2.75; //zoom out for big orbitals
    float intensityFactor = float((l+1)*l+n*n)*sqrt(float(n)); // visual rescaling

    pos = vec3(pos.x,pos.z,-pos.y);

    vec2 H = hydrogen(pos*zoomFactor, n, l, m);
    H *= intensityFactor;

    //now the wave function has been appropriately scaled up: build a density function
    //out of this, by drawing probability densities:
    float prob = H.x*H.x;

    // return prob;

    float bkg = min(5.,exp(3.*prob)-0.95);
    return bkg;




}






#define Pi 3.14159265359

//set to 1 for a higher quality version
#define HD 0

#if HD
#define FogSteps 128
#define ShadowSteps 8
#else
#define FogSteps 64
#define ShadowSteps 1
#endif

#define FogRange 5.
#define ShadowRange 2.

#define ShadowSampleBias 2.
#define FogSampleBias 1.

#define Anisotropy .4

vec3 VolumeColor;
vec3 CamPos = vec3(0., 0., -2.2);
vec3 CamRot = vec3(-.2, 0., 0.);
float CamFocalLength = .7;
vec3 LightRot = vec3(1., 0., 0.);
vec3 LightCol = vec3(5.);

mat3 rotationMatrix(vec3 rotEuler){
    float c = cos(rotEuler.x), s = sin(rotEuler.x);
    mat3 rx = mat3(1, 0, 0, 0, c, -s, 0, s, c);
    c = cos(rotEuler.y), s = sin(rotEuler.y);
    mat3 ry = mat3(c, 0, -s, 0, 1, 0, s, 0, c);
    c = cos(rotEuler.z), s = sin(rotEuler.z);
    mat3 rz = mat3(c, -s, 0, s, c, 0, 0, 0, 1);
    return rz * rx * ry;
}

float henyeyGreenstein(vec3 dirI, vec3 dirO){
    return Pi/4.*(1.-Anisotropy*Anisotropy) / pow(1.+Anisotropy*(Anisotropy-2.*dot(dirI, dirO)), 1.5);
}


vec3 directLight(vec3 pos, vec3 dir, float headStart, vec2 fragCoord){
    vec3 lightDir = vec3(0., 0., 1.) * rotationMatrix(LightRot);
    vec3 pos0 = pos, oldPos, volAbs = vec3(1.);
    float stepDist;
    for(int i = 0; i < ShadowSteps; i++){
        oldPos = pos;
        pos = pos0 - lightDir * pow((float(i)+headStart) / float(ShadowSteps), ShadowSampleBias) * ShadowRange;
        volAbs *= vec3(exp(-density(pos, fragCoord)*length(pos-oldPos)*VolumeColor));
    }
    return LightCol * volAbs * henyeyGreenstein(-lightDir, dir);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){

    vec2 uv = (fragCoord-iResolution.xy/2.0) / iResolution.y;

    VolumeColor = vec3(cos(iTime*.5), sin(iTime*.4), sin(iTime*.3))*.35+.5;
    CamRot.x = sin(iTime/5.);
    CamRot.y += iTime*.3;
    LightRot.y -= iTime*.25;

    CamPos *= rotationMatrix(CamRot);
    vec3 dir = normalize(vec3(uv, CamFocalLength)) * rotationMatrix(CamRot);

    float headStartCam = 0.;
    float headStartShadow = 0.;

    vec3 volCol = vec3(0.), volAbs = vec3(1.), pos = CamPos, oldPos, stepAbs, stepCol;
    float prob, dx,integratedProb=0.;
    for(int i = 0; i < FogSteps; i++){
        oldPos = pos;
        pos = CamPos + dir * pow((float(i)) / float(FogSteps), FogSampleBias) * FogRange;
        prob = density( pos, fragCoord );
        dx =length(pos-oldPos);
        integratedProb += prob*dx;
        stepAbs = exp(-prob * dx *VolumeColor);
        stepCol = vec3(1.)-stepAbs;
        volCol += stepCol*volAbs*directLight(pos, dir, headStartShadow, fragCoord);
        volAbs *= stepAbs;
    }


    //now can do stuff to the volume color:
    // volCol = vec3(integratedProb);


    //get random noise:
    uint seed = randomSeed(fragCoord.xy, float(100.*iTime));
    float random = randomFloat(seed);


    //    if(random<integratedProb){
    //         volCol = vec3(1,1,1);
    //     }

    //add noise to the image
    float fogStrength = 0.5;
    float noise = exp((random*.5-.5)*fogStrength);
    volCol *= noise;

    fragColor = vec4(ACESFilm(volCol), 1.);
}
