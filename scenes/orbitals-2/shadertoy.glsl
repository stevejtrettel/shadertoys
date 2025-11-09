



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
float density(vec3 pos){

    int n, m, l;
    n=4;
    l=2;
    m=2;


    float zoomFactor = float(n*n+1)*1.75; //zoom out for big orbitals
    float intensityFactor = float((l+1)*l+n*n)*sqrt(float(n)); // visual rescaling

    pos = vec3(pos.x,pos.z,-pos.y);

    vec2 H = hydrogen(pos*zoomFactor, n, l, m);
    H *= intensityFactor;


    //now the wave function has been appropriately scaled up: build a density function
    //out of this, by drawing probability densities:
    float prob = sign(H.x)*H.x*H.x;

    //if(prob>0.9){
    //return 5.;}
    //else{return 0.1;}

    return H.x/2.;

}


vec3 lightDir = normalize( vec3( 1.0,0.5,-1.0 ) );


vec2 sphIntersect( in vec3 ro, in vec3 rd, in vec4 sph ){
    vec3 oc = ro - sph.xyz;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0,-1.0);
    float  sh =  sqrt( h );
    return vec2( -b-sh, -b+sh);
}

vec2 rot(in vec2 v,in vec2 u){ return vec2(v.x*u.x-v.y*u.y,v.x*u.y+v.y*u.x); }

void mainImage( out vec4 fragColor, in vec2 fragCoord ){

    vec2  p = (2.0*fragCoord.xy-iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, 4.0 );
    vec3 rd = normalize( vec3(p,-2.0) );


    vec2 rvec= vec2(cos(iTime/5.),sin(iTime/5.));
    ro.zy = rot(ro.zy,rvec);
    rd.zy = rot(rd.zy,rvec);


    vec2 camX = vec2( cos(iTime/1.),sin(iTime/1.) );
    ro.xz = rot(ro.xz,camX);
    rd.xz = rot(rd.xz,camX);




    vec4 sph = vec4( vec3(0.0,0.0,0.0), 2.0 );

    vec2 tt = sphIntersect( ro, rd, sph );

    //vec3 mclr = vec3( 0.2,0.5,0.5 );


    vec4 clrsum = vec4(0.0);
    float t = tt.x;
    float it = 0.0;
    if( tt.x>0.0 ){
        for(int i=0; i<64; i++){
            vec3 pos = ro + t*rd;
            float f = density( pos )*5.0;

            vec3 mclr = (f>0.0)?vec3(0.0,0.5,1.0):vec3(1.0,0.5,0.0);
            float dens = f*f;


            // --- uniform walk occluding
            //float dt    = 0.05;
            //float da    = dens*dt*2.0;
            // float wa    = 1.0-clrsum.a; wa=clamp(wa,0.0,1.0);
            // clrsum += vec4( mclr,2.0 ) * da * wa;
            // t += dt;


            // --- nonuniform walk occluding
            float dt    = 0.05/(dens*10.0 + 1.0 );
            //float dt    = 0.05/(sqrt(dens)*4.0 + 1.0 );
            float da    = dens*dt*4.0;
            float wa    = 1.0-clrsum.a; wa=clamp(wa,0.0,1.0);
            clrsum += vec4( mclr,3.0 ) * da * wa;
            t += dt;


            it+= (1.0/64.0);
            if( (t>tt.y) ) break;
        }
    }



    clrsum.rgb *=2.0;
    clrsum.rgb += (1.0-clrsum.a)*vec3(1.0,1.0,1.0);
    clrsum.a=1.0;


    fragColor = clrsum;

}





