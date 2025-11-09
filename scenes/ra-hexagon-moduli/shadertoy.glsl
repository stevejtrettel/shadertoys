//default is drawn in poincare disk:
//switch to upper half plane?
bool halfPlane=false;


//a hyperbolic hexagon is determined
//by three alternating side lengths.
//choose any 3 positive real numbers here
//to draw the hexagon of your choice!
vec3 chooseRepresentation(){

    float l = asinh(sqrt(3.));

    float A = l+0.2*sin(iTime);
    float B = l+0.3*sin(iTime/2.);
    float C = l+0.4*sin(iTime/3.);

    return vec3(A,B,C);
}













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
vec3 medGreen = vec3(149, 245, 181)/255.;

vec3 pink = vec3(255, 117, 133)/255.;


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
    uv = 4.*uv;

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





//------------------------------------------
//Right Angled Hexagons
//------------------------------------------

//a  right angled pentagon is the intersection of 5 orthognal half spaces
//we will call these a, b, c, d, and e
struct Hexagon{
    HalfSpace a;
    HalfSpace b;
    HalfSpace c;
    HalfSpace d;
    HalfSpace e;
    HalfSpace f;
};




bool inside(vec2 z, Hexagon H){
    //check if you are inside all six half-spaces
    return inside(z,H.a)&&inside(z,H.b)&&inside(z,H.c)&&inside(z,H.d)&&inside(z,H.e)&&inside(z,H.f);
}



//reflect in each side of the triangle,
//if the point is on the wrong side of the half space
vec2 reflectIn(vec2 z, Hexagon H, inout float parity){
    z = reflectIn(z, H.a, parity);
    z = reflectIn(z, H.b, parity);
    z = reflectIn(z, H.c, parity);
    z = reflectIn(z, H.d, parity);
    z = reflectIn(z, H.e, parity);
    z = reflectIn(z, H.f, parity);
    return z;
}



//iteratively reflect until you end up in the domain
//report the parity of the number of flips:
vec2 moveInto(vec2 z, Hexagon H, out float parity){

    parity=1.;

    for(int i=0;i<50;i++){
        z=reflectIn(z,H,parity);
        if(inside(z,H)){
            break;
        }
    }

    return z;

}



float dist( vec2 z, Hexagon H){
    float d;
    d = dist(z, H.a.bdy);
    d = min(d, dist(z, H.b.bdy));
    d = min(d, dist(z, H.c.bdy));
    d = min(d, dist(z, H.d.bdy));
    d = min(d, dist(z, H.e.bdy));
    d = min(d, dist(z, H.f.bdy));
    return d;
}



Hexagon createHexagon(float x, float y, float z){

    //sinh and cosh of the original side lengths
    float cx = cosh(x);
    float cy = cosh(y);
    float cz = cosh(z);

    float sx = sinh(x);
    float sy = sinh(y);
    float sz = sinh(z);

    //compute the opposing side lengths
    float cX = (cx+cy*cz)/(sy*sz);
    float cY = (cy+cx*cz)/(sx*sz);
    float cZ = (cz+cx*cy)/(sx*sy);

    float X = acosh(cX);
    float Y = acosh(cY);
    float Z = acosh(cZ);

    float sX = sinh(X);
    float sY = sinh(Y);
    float sZ = sinh(Z);


    //start computing the edges:

    //to the right of the vertical line
    HalfSpace a = HalfSpace(Geodesic(0.,infty),1.);

    //above the unit circle
    HalfSpace b = HalfSpace(Geodesic(-1.,1.),1.);

    //below the circle at height Y above unit circle
    HalfSpace f = HalfSpace(Geodesic(exp(Y),-exp(Y)),-1.);

    //above the circle which is translate of vertical line along unit circle by dist x
    HalfSpace c = HalfSpace(Geodesic(tanh(x/2.),1./tanh(x/2.)),1.);

    //above the circle that is a translate by z along unit circle, then by Y along vertical geodesic
    HalfSpace e = HalfSpace(Geodesic(exp(Y)*tanh(z/2.),exp(Y)/tanh(z/2.)),1.);

    //the final circle is the minimizing geodesic between the sides c and e:
    //this side is the image of the vertical line after translating D along unit circle, then h along vertical geodesic
    float cD = sx*sZ;
    float D = acosh(cD);
    float sD = sinh(D);

    float sh = cZ/sD;
    float h = asinh(sh);

    HalfSpace d = HalfSpace(Geodesic(exp(h)*tanh(D/2.),exp(h)/tanh(D/2.)),1.);

    //finally we have the complete hexagon
    Hexagon H = Hexagon(a,b,c,d,e,f);
    return H;
}







//----------------------------------------------
//------------------------------------------
//PRODUCING THE IMAGE
//------------------------------------------
//----------------------------------------------



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    //the vector that will store our final color:
    vec3 color=vec3(0);
    //an overall scaling factor to lighten/darken the image
    float adjustment = 1.;

    // Normalized pixel coordinates
    vec2 z = normalizeCoords( fragCoord );
    vec2 mouse = normalizeCoords(iMouse.xy);



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
        z=rot*z;

        //check if insidePD
        //if not, turn down the exposure
        if(!insidePD(z)){
            adjustment =0.2;
        }

        //move to upper half plane for computations
        z = toHP(z);
        vec2 mouseHP = toHP(mouse);

        //move the origin of PD to mouse location
        if(iMouse.z>0.){
            z=pToOrigin(mouse,z);
        }


        //transform things so that the pentagon's "center" is in the middle
        vec2 cent = vec2(-0.5,0.65)+0.05*vec2(sin(iTime/3.),sin(iTime/2.));
        z=pToOrigin(cent, z);
    }


    //create a geometric representataion of the right angled pentagon
    vec3 rep = chooseRepresentation();
    Hexagon P = createHexagon(rep.x,rep.y,rep.z);


    //set background color of the disk
    color = darkBlue;


    //color the fundamental domain
    if(inside(z,P)){
        color=pink;
    }


    //reflect all other points into the fundamental domain:
    //color orientation preserving and revesing pentagons depending on parity
    float parity=1.;
    vec2 w = moveInto(z,P,parity);
    if(parity==-1.){
        color=medBlue;
    }


    //color the edges of the pentagonal tiling
    float d = dist(w, P);
    if(d<0.015){color=lightPurple;}



    //take the computed color and apply the adjustment
    color = adjustment*color;
    //output to the computer screen
    fragColor=vec4(color,1);
}





