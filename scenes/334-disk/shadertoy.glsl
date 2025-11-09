//default is drawn in poincare disk:
//switch to upper half plane?
bool halfPlane=false;
//switch to band model?
bool band = false;
bool klein = false;

//set the triangle:
int P = 3;
int Q = 3;
int R = 4;

//------------------------------------------
//Useful Constants
//------------------------------------------

float PI = 3.14159;
float sqrt2 = sqrt(2.);
float sqrt3 = sqrt(3.);
vec2 I = vec2(0.,1.);

//floating point infinity:
//the funciton isinf() tests if a value is infinite, returning a boolean
float infty = 1./0.;



//------------------------------------------
//Useful Colors
//------------------------------------------

vec3 lightBlue = vec3(170,210,255)/255.;
vec3 medBlue = vec3(120, 170, 250)/255.;
vec3 darkBlue = vec3(110, 155, 240)/255.;

vec3 lightPurple = vec3(170,210,255)/255. + vec3(0.2,0,0);
vec3 medPurple = vec3(120, 170, 250)/255. + vec3(0.3,0,0);
vec3 darkPurple = 0.7*(vec3(110, 155, 240)/255. + vec3(0.3,0,0));

vec3 lightGreen = vec3(149, 245, 181)/255.;
vec3 medGreen = vec3(.51, .92, .62);
vec3 darkGreen = vec3(.38, .64, .45);

vec3 pink = vec3(255, 117, 133)/255.;


vec3 usfYellow = vec3(255, 184, 28)/255.;
vec3 usfGray = vec3(117,120,123)/255.;
vec3 usfGreen = vec3(32,92,64)/255.;
vec3 white = vec3(1,1,1);


//----------------------------------------------
//------------------------------------------
//SETUP
//------------------------------------------
//----------------------------------------------

//this takes in the pixel coordinates on the screen (fragCoord) and rescales
//them to show the appropriate region of the plane
vec2 normalizeCoords( vec2 fragCoord ){

    // Normalized the pixel coordinates from 0 to 1
    //fragCoord is a vector of integers, giving the pixel on the screen
    //its (0,0) in the top left, increasing down and to the right.
    //iResolution is a uniform giving the total number of pixels across x,y
    //the bottom right corner of the screen has pixel coordinates (iResolution.x, iResolution.y)


    //dividing fragCoord by iResolution results in coordinates running from (0,0) to (1,1)
    vec2 uv =fragCoord/iResolution.xy;

    //translate so coordinates run (-0.5, 0.5)
    uv = uv - vec2(0.5);

    //preserve original aspect ratio
    float aspect = iResolution.y/iResolution.x;
    uv = vec2(1,aspect)*uv;

    //rescale however you like
    uv = 5.*uv;

    return uv;
}






//----------------------------------------------
//------------------------------------------
//COMPLEX NUMBERS
//------------------------------------------
//----------------------------------------------

//points in the hyperbolic plane are represented by vec2(x,y)
//these can be added, subtracted and scalar multiplied by built-in operations
//these can be multiplied and inverted (as complex numbers) using the following


//turn a real number into a complex number
vec2 toC( float x ){
    return vec2(x,0);
}



//complex multiplication
vec2 mult( vec2 z, vec2 w )
{
    float re = z.x*w.x - z.y*w.y;
    float im = z.x*w.y + z.y*w.x;

    vec2 res = vec2(re, im);
    return res;
}


//complex conjugation, negates imaginary party
vec2 conj( vec2 z )
{
    vec2 res = vec2(z.x,-z.y);
    return res;
}


//inverse of the complex number z
vec2 invert( vec2 z )
{
    float mag2 = dot(z,z);
    vec2 res = conj(z)/mag2;
    return res;
}


//compute the quotient z/w
vec2 divide( vec2 z, vec2 w )
{
    return mult(z,invert(w));
}






//----------------------------------------------
//------------------------------------------
//CONVERSIONS BETWEEN MODELS
//------------------------------------------
//----------------------------------------------


//------------------------------------------
//Poincare Disk Model
//------------------------------------------


//check if you are inside the unit disk or not
bool insidePD( vec2 z )
{
    //returns true if the inequality is satisfied, falso otherwise
    return dot(z,z)<1.;
}



//apply the mobius transformation taking a point to UHP
//this is the map z -> (iz+1)/(z+i)
vec2 toHP( vec2 z ){

    vec2 num = z+I;
    vec2 denom = mult(I,z)+toC(1.);
    vec2 res = divide(num,denom);
    return res;
}









//------------------------------------------
//Upper Half Plane Model
//------------------------------------------

//check if you are in the upper half plane or not
bool insideHP( vec2 z )
{
    //returns true if the inequality is satisfied, falso otherwise
    return z.y>0.;
}


//take a point in the upper half plane and map it to the disk
//this is the transformation z -> (z-i)/(z+i)
vec2 toPD(vec2 z){
    vec2 num = z-I;
    vec2 denom = z+I;
    vec2 res = divide(num,denom);
    return res;
}





//------------------------------------------
//BAND MODEL:
//------------------------------------------


vec2 cmul(vec2 a, vec2 b)
{
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}
vec2 cdiv(vec2 a, vec2 b)
{
    float b2 = dot(b, b);
    return vec2(dot(a, b), a.y * b.x - a.x * b.y) / b2;
}
vec2 ctanh(vec2 z)
{
    float d = cosh(2.*z.x) + cos(2.*z.y);
    return vec2(sinh(2.*z.x), sin(2.*z.y)) / d;
}

//ctanh converts from band to PD:

bool insideBand(vec2 z){
    return abs(z.y)<0.8;
}


//------------------------------------------
//KLEIN MODEL:
//------------------------------------------


vec2 kleinToPD(vec2 z){
    float s=length(z);
    if(s==0.){
        return vec2(0,0);
    }
    else{
        z=z/s;
        float u = s/(1.+sqrt(1.-s*s));
        z = z*u;
        return z;
    }
}






//----------------------------------------------
//------------------------------------------
//Upper Half Plane
//------------------------------------------
//----------------------------------------------

//this is a general mobius transformation applied to points in upper half space
//do the mobius transformation ((a,b),(c,d)).z
vec2 applyMobius(vec4 mob, vec2 z){
    float a=mob.x;
    float b=mob.y;
    float c=mob.z;
    float d=mob.w;

    vec2 num = a*z+toC(b);
    vec2 denom = c*z + toC(d);

    vec2 res = divide(num,denom);

    return res;

}




//return result of the isometry in stab(infty) which sends origin to p, applied to z
vec2 originToP(vec2 p, vec2 z){
    float x = p.x;
    float y = p.y;

    //expand by y
    z = y*z;

    //slide by x
    z=z+vec2(x,0);

    //together this took (0,1) to (0,y) to (x,y)
    return z;
}


vec2 pToOrigin(vec2 p, vec2 z){
    float x = p.x;
    float y = p.y;
    float r = x;

    //slide by x
    z = z - vec2(x, 0.);

    //divide by y
    z = z/y;

    //now; p has been moved to (x,y)->(0,y)->(0,1)
    //which is the origin of UHP
    return z;
}






//------------------------------------------
//Points
//------------------------------------------
// a point is just a vec2, thought of as a complex number;
//no special structure here


//measure the distance to a point
float dist(vec2 z, vec2 p){

    //just directly using distance function in UH
    vec2 rel = z-p;
    float num = dot(rel,rel);
    float denom = 2.*z.y*p.y;
    return acosh(1.+num/denom);

}






//------------------------------------------
//Geodesics
//------------------------------------------


//a geodesic is encoded by remembering its two boundary points
//these are real numbers (or the constant infty)
struct Geodesic{
//first endpoint
    float p;
//second endpoint
    float q;
};



//check if a geodesic is a line
bool isLine( Geodesic geo ) {
    return isinf(geo.p)||isinf(geo.q);
}




//check if a geodesic is a line, and return its endpoint
bool isLine( Geodesic geo, out float endpt ) {

    //if p is infinity, q is the real endpoint
    if(isinf(geo.p)){
        endpt = geo.q;
        return true;
    }

    //if q is infinity, p is the real endpoint
    else if ( isinf(geo.q) ){
        endpt = geo.p;
        return true;
    }

    //if neither is infinity, its not a line
    return false;
}





//reflect in the geodesic geo
vec2 reflectIn(vec2 z, Geodesic geo){

    float endpt;

    //if its a line, do one thing
    if(isLine(geo,endpt)){
        z.x -= endpt;
        z.x *= -1.;
        z.x += endpt;
        return z;
    }

    //else, if its a circle do something else
    else{
        float center = (geo.p+geo.q)/2.;
        float radius = abs((geo.p-geo.q))/2.;

        z.x -= center;
        z /= radius;
        z /= dot(z,z);
        z *= radius;
        z.x += center;

        return z;
    }
}





//reflect in the geodesic geo
//overload for points on the boundary
float reflectIn(float p, Geodesic geo){

    float endpt;

    //if its a line, do one thing
    if(isLine(geo,endpt)){
        p -= endpt;
        p *= -1.;
        p += endpt;
        return p;
    }

    //else, if its a circle do something else
    else{
        float center = (geo.p+geo.q)/2.;
        float radius = abs((geo.p-geo.q))/2.;

        p -= center;
        p /= radius;
        p /= p*p;
        p *= radius;
        p += center;

        return p;
    }
}




//measure the distance to a geodesic
float dist(vec2 z, Geodesic geo){

    float endpt;

    //if its a vertical line
    if(isLine(geo,endpt)){
        //translate to the origin
        z.x-=endpt;
        //measure distance as angle
        float secTheta=length(z)/abs(z.y);
        return acosh(secTheta);
    }

    //otherwise, its a circle
    else{

        //build mobius transformation taking geo to (0,infty)
        vec4 mob=vec4(1.,-geo.p,1.,-geo.q);
        z = applyMobius(mob, z);

        //now measure the distance to this vertical line
        //measure distance as angle
        float secTheta=length(z)/abs(z.y);
        return acosh(secTheta);
    }
}








//------------------------------------------
//Half Spaces
//------------------------------------------


//a half space is bounded by a geodesic,
//and is all the area on one side of it
//side is - if it contains a portion of the real line (bounded area in model)
//side is + if it contains infinity
struct HalfSpace{
    Geodesic bdy;
    float side;
};



//inside checks if you are in a half space or not:
bool inside(vec2 z, HalfSpace hs){

    float endpt;

    //if the half space is bounded by a line:
    if( isLine( hs.bdy, endpt ) ){

        //is point to the right (+) or left (-) of the boundary?
        float side = sign(z.x - endpt);

        //check if this is inside (+) or outside (-) the halfspace
        return side*hs.side>0.;
    }

    //otherwise, the half space is bounded by a circle
    //endpoint was never assigned so dont use it
    else{

        float center = (hs.bdy.p+hs.bdy.q)/2.;
        float radius = abs((hs.bdy.p-hs.bdy.q))/2.;

        //get relative position
        vec2 rel = z-toC(center);
        //get radius
        float dist2 = dot(rel,rel);

        //get inside (+) or outside (-) circle
        float side = sign(dist2-radius*radius);

        //return true (+) if in half space, false if not
        return side*hs.side>0.;
    }
}




//reflect into a half space:
//if you are inside already, do nothing
//if you are outside, reflect in the boundary
//parity is +-1, if we do a reflection we multiply it by -1.
vec2 reflectIn( vec2 z, HalfSpace hs, inout float parity) {
    if(!inside(z,hs)){
        vec2 res = reflectIn(z,hs.bdy);
        parity*=-1.;
        return res;
    }

    return z;
}



//reflect into a half space:
//if you are inside already, do nothing
//if you are outside, reflect in the boundary
vec2 reflectIn( vec2 z, HalfSpace hs) {
    if(!inside(z,hs)){
        vec2 res = reflectIn(z,hs.bdy);
        return res;
    }

    return z;
}





//------------------------------------------
//Right Angled Pentagons
//------------------------------------------

//a  right angled pentagon is the intersection of 5 orthognal half spaces
//we will call these a, b, c, d, and e
struct Pentagon{
    HalfSpace a;
    HalfSpace b;
    HalfSpace c;
    HalfSpace d;
    HalfSpace e;
};




bool inside(vec2 z, Pentagon P){
    //check if you are inside all three half-spaces
    return inside(z,P.a)&&inside(z,P.b)&&inside(z,P.c)&&inside(z,P.d)&&inside(z,P.e);
}




//reflect in each side of the triangle,
//if the point is on the wrong side of the half space
vec2 reflectIn(vec2 z, Pentagon P, inout float parity){
    z = reflectIn(z, P.a, parity);
    z = reflectIn(z, P.b, parity);
    z = reflectIn(z, P.c, parity);
    z = reflectIn(z, P.d, parity);
    z = reflectIn(z, P.e, parity);
    return z;
}




//iteratively reflect until you end up in the domain
//report the parity of the number of flips:
vec2 moveInto(vec2 z, Pentagon P, out float parity){

    parity=1.;

    for(int i=0;i<50;i++){
        z=reflectIn(z,P,parity);
        if(inside(z,P)){
            break;
        }
    }

    return z;

}



float dist( vec2 z, Pentagon P){
    float d;
    d = dist(z, P.a.bdy);
    d = min(d, dist(z, P.b.bdy));
    d = min(d, dist(z, P.c.bdy));
    d = min(d, dist(z, P.d.bdy));
    d = min(d, dist(z, P.e.bdy));
    return d;
}



Pentagon createPentagon(float A, float B){

    //to the right of the vertical line
    HalfSpace a = HalfSpace(Geodesic(0.,infty),1.);

    //above the unit circle
    HalfSpace b = HalfSpace(Geodesic(-1.,1.),1.);

    //above the circle which is translate of vertical line along unit circle by dist B
    HalfSpace c = HalfSpace(Geodesic(tanh(B/2.),1./tanh(B/2.)),1.);


    //below the circle at height A above unit circle
    HalfSpace e = HalfSpace(Geodesic(exp(A),-exp(A)),-1.);



    //this final circle is the translate of the vertical geodesic along unit circle by E, then dilation z->exp(A)z
    //the computaiton is annoying because we need tanh(E/2) and coth(E/2) for the endpoints; but need them in terms of A and B

    float cA = cosh(A);
    float sA = sinh(A);
    float cB = cosh(B);
    float sB = sinh(B);

    float cD = sA*sB;
    float sD = sqrt(cD*cD-1.);

    //coshE and sinhE:
    float cE = sB*cA/sD;
    float sE = cB/sD;

    //tanh(E/2):
    float tanhE2 = sE/(1.+cE);
    float eA = exp(A);

    float end1 = eA*tanhE2;
    float end2 = eA/tanhE2;

    //above this circle
    HalfSpace d = HalfSpace(Geodesic(end1,end2),1.);

    Pentagon P = Pentagon(a,b,c,d,e);
    return P;
}





//------------------------------------------
//Reflection Triangles
//------------------------------------------

//a  triangle is the intersection of 3 half spaces
struct Triangle{
    HalfSpace a;
    HalfSpace b;
    HalfSpace c;
};




bool inside(vec2 z, Triangle P){
    //check if you are inside all three half-spaces
    return inside(z,P.a)&&inside(z,P.b)&&inside(z,P.c);
}




//reflect in each side of the triangle,
//if the point is on the wrong side of the half space
vec2 reflectIn(vec2 z, Triangle P, inout float parity){
    z = reflectIn(z, P.a, parity);
    z = reflectIn(z, P.b, parity);
    z = reflectIn(z, P.c, parity);
    return z;
}




//iteratively reflect until you end up in the domain
//report the parity of the number of flips:
vec2 moveInto(vec2 z, Triangle P, out float parity){

    parity=1.;

    for(int i=0;i<50;i++){
        z=reflectIn(z,P,parity);
        if(inside(z,P)){
            break;
        }
    }

    return z;

}



float dist( vec2 z, Triangle P){
    float d;
    d = dist(z, P.a.bdy);
    d = min(d, dist(z, P.b.bdy));
    d = min(d, dist(z, P.c.bdy));
    return d;
}



Triangle createTriangle(int P, int Q, int R){

    float p = float(P);
    float q = float(Q);
    float r = float(R);

    //to the right of the vertical line
    HalfSpace a = HalfSpace(Geodesic(-cos(PI/p),infty),1.);

    //above the unit circle
    HalfSpace b = HalfSpace(Geodesic(-1.,1.),1.);


    //now need to compute the last circle:  this needs some numbers
    //the hyperbolic side length of the side opposite angle r:

    float num = cos(PI/r)+cos(PI/p)*cos(PI/q);
    float denom = sin(PI/p)*sin(PI/q);
    float sr = acosh(num/denom);
    //above i, the Euclidean point at this distance would be exp(sr):
    //but we are not above i, we are at sin(pi/p): so we need to scale
    float eucH = sin(PI/p)*exp(sr);

    //now can get center of remaining circle and its radius:
    float want = eucH/tan(PI/q);
    float cent = -cos(PI/p)-want;
    float rad = sqrt(want*want+eucH*eucH);

    float pt1 = cent - rad;
    float pt2 = cent + rad;

    //above the circle which is translate of vertical line along unit circle by dist B
    HalfSpace c = HalfSpace(Geodesic(pt1,pt2),-1.);



    Triangle T = Triangle(a,b,c);
    return T;
}







//----------------------------------------------
//------------------------------------------
//PRODUCING THE IMAGE
//------------------------------------------
//----------------------------------------------



//set representation to any vector (A,B) of two positive real numbers satisfying the inequality
//sinh(A)sinh(B)>1.
//the example here has the side lengths oscilating periodically about 1.3
vec2 chooseRepresentation(){
    float A = 1.3+0.2*sin(iTime);
    float B = 1.3+0.3*sin(iTime/2.);
    return vec2(A,B);
}




vec3 getColor(vec2 fragCoord){

    //the vector that will store our final color:
    vec3 color=vec3(0);
    //an overall scaling factor to lighten/darken the image
    float adjustment = 1.;

    // Normalized pixel coordinates
    vec2 z = normalizeCoords( fragCoord );
    vec2 mouse = normalizeCoords(iMouse.xy);

    bool insideDomain;



    if(halfPlane){
        //this is actually easier to compute: we just begin automatially with the half plane
        //need to shift downwards
        z=z+vec2(0,1.);
        mouse=mouse+vec2(0,1.);

        //turn down the exposure if in lower half plane
        if(z.y<0.){
            adjustment=0.2;
        }

        //move the origin of PD to mouse location
        z = pToOrigin(mouse,z);
    }

    //the default view: start from the poincare disk
    else{

        //rotate slowly around the center of the poincare disk for fun
        float c=cos(iTime/50.);
        float s=sin(iTime/50.);
        mat2 rot = mat2(c,s,-s,c);
        //z=rot*z;



        if(band){
            insideDomain = insideBand(z);
            if(!insideDomain){
                adjustment =0.5*tanh(8.*(abs(z.y)-0.75));
            }
            z=ctanh(z);
        }

        else if(klein){

            insideDomain=insidePD(z);
            if(!insideDomain){
                adjustment= 0.5*tanh(8.*(length(z)-0.97));
            }
            z=kleinToPD(z);
        }


        else{


            //check if insidePD
            insideDomain = insidePD(z);
            //if not, turn down the exposure
            if(!insideDomain){
                adjustment =0.5*tanh(8.*(length(z)-0.97));
            }

        }

        //move to upper half plane for computations
        z = toHP(z);
        vec2 mouseHP = toHP(mouse);

        //move the origin of PD to mouse location
        z = pToOrigin(mouse,z);


        //transform things so that the pentagon's "center" is in the middle
        vec2 cent = vec2(1.,1.5)+0.25*vec2(sin(iTime/3.),sin(iTime/2.));
        //z=pToOrigin(cent, z);
    }


    //create a geometric representataion of the right angled pentagon
    vec2 rep = chooseRepresentation();
    //Pentagon T = createPentagon(1.07,1.07);
    Triangle T = createTriangle(P,Q,R);


    //set background color of the disk
    if(insideDomain){
        color =medBlue;
    }
    else{
        color=0.8*medGreen;
    }


    //color the fundamental domain
    if(inside(z,T)){
        //color=usfYellow;
    }


    //reflect all other points into the fundamental domain:
    //color orientation preserving and revesing pentagons depending on parity
    float parity=1.;
    vec2 w = moveInto(z,T,parity);
    if(parity==-1.){

        if(insideDomain){
            color=darkBlue;
        }
        else{
            color=0.9*darkGreen;
        }
    }


    //if PENTAGONS: just use this one, comment out what's below:
    // if(d<0.001){
    // color=white;
    //  }

    //color the edges of the TRIANGLE TILING
    float d = dist(w, T);
    if(d<0.007){
        if(insideDomain){
            color=0.8*darkBlue;
        }
        else{
            color=usfYellow;
        }

    }



    Geodesic g=T.a.bdy;
    vec3 sideColor=white;



    ///comment out if you dont want it flashing
    float t=iTime/5.-floor(iTime/5.);
    if(t<0.33){
        g=T.a.bdy;

    }
    else if(t>0.66){
        g=T.b.bdy;
    }
    else{
        g=T.c.bdy;
    }


    if(dist(w,g)<0.015){
        if(insideDomain){
            color=sideColor;
        }
        else{
            color=0.9*sideColor;
        }

    }






    //take the computed color and apply the adjustment
    color = adjustment*color;
    //output to the computer screen
    return color;

}



//antialiasing:
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec3 col;
    col = getColor(fragCoord);

    fragColor = vec4(col,1);
}





