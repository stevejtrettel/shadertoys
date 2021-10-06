//A tiling of the hyperbolic plane by right angled hexagons determines a genus 2 surface
//doubling such a hexagon along a triplet of alternating sides gives a pair of pants,
//and doubling that pair of pants across its boundary gives a genus 2 surface



float PI=3.14159;

//------------------------------------------
//Define hyperbolic half spaces, reflections
//------------------------------------------

//vertical line to reflect in
//side=+1 means the half space contains points to the right, -1 to the left
struct Line{
    float pos;
    float side;
};


//semicircle centered on real line to reflect in
//side =+1 means the halfspace contains points below, -1 means above
struct Circle{
    float center;
    float radius;
    float side;
};



//reflection in vertical line defining a half space
//this is done by conjugating reflection in the line x=0
//by the translation taking this line there
void invert(inout vec2 p, Line line){

    p.x -= line.pos;
    p.x *= -1.;
    p.x += line.pos;

}

//reflection in a circle defining a half space
//this is done by conjugating inversion in the unit circle
//with a similarity transformation taking the given circle to the unit circle
void invert(inout vec2 p, Circle circle){

    p.x -= circle.center;
    p /= circle.radius;
    p /= dot(p,p);
    p *= circle.radius;
    p.x += circle.center;

}

//check if inside a half space bounded by a line:
bool inside(vec2 p, Line line){
    if(line.side>0.){//check if we are on the right side
        return p.x>line.pos;
    }
    else{//check if we are on the left side
        return p.x<line.pos;
    }
}

//check if inside a half space bounded by a circle
bool inside(vec2 p, Circle circle){
    if(circle.side>0.){//check if we are inside the semicircle
        return length(p-vec2(circle.center,0))<circle.radius;
    }
    else{//check if we are outside the semicircle
        return length(p-vec2(circle.center,0))>circle.radius;
    }
}


//check if we are inside
void reflectIn(inout vec2 p, Circle circle, inout float invCount){
    if(!inside(p,circle)){
        invert(p,circle);
        invCount+=1.;
    }
}

void reflectIn(inout vec2 p, Line line, inout float invCount){
    if(!inside(p,line)){
        invert(p,line);
        invCount+=1.;
    }
}



//------------------------------------------
//some hyperbolic geometry
//------------------------------------------

//do a rotation in the upper half plane of angle theta about i
float rot(float x, float theta){
    float c=cos(theta/2.);
    float s=sin(theta/2.);
    mat2 mat=mat2(c,s,-s,c);
    vec2 p=mat*vec2(x,1.);
    return p.x/p.y;
}


//the above is only a rotational mobius transformation applied to the real line
//this is a general mobius transformation applied to points in upper half space
//do the mobius transformation ((a,b),(c,d)).z
vec2 mobiusTransf(vec4 mob, vec2 z){
    float a=mob.x;
    float b=mob.y;
    float c=mob.z;
    float d=mob.w;
    float Z2=length(z)*length(z);
    float term1=c*z.x+d;
    float term2=c*z.y;
    float denom=term1*term1+term2*term2;

    term1=a*c*Z2+b*d+(a*d+b*c)*z.x;
    term2=(a*d-b*c)*z.y;

    return vec2(term1,term2)/denom;
}


//measure the distance to a vertical line geodesic
float dist(vec2 p, Line line){
    //translate line to oriign
    p.x-=line.pos;
    float secTheta=length(p)/abs(p.y);
    return acosh(secTheta);
}

//measure the distance to a circle geodesic
float dist(vec2 p, Circle circle){
    float end1=circle.center-circle.radius;
    float end2=circle.center+circle.radius;
    vec4 mob=vec4(1.,-end1,1.,-end2);

    //do the mobius transformation making this segment vertical:
    vec2 z=mobiusTransf(mob, p);

    //now measure the distance to this vertical line
    return dist(z,Line(0.,1.));
}




//------------------------------------------
//set up the fundamental domain
//------------------------------------------


//Give names to the sides of the shape
Circle C0,C1,C2,L12,L20;
Line L01;

//function that defines these sides
//a right angled hexagon is determined by three moduli
//here we list them as a,b,h: these directly specify the "C-Circles"
//then we build the "L-Circles" from them
void setUpFD(float a, float b, float h){

    C0=Circle(0.,1.,1.);
    C1=Circle(0.,a,-1.);
    C2=Circle(h,b,-1.);

    //the radius of the short circles depends on these as calculated:
    //Lij is the circle intersecting Ci and Cj orthogonally

    float u=(h*h+a*a-b*b)/(2.*h);
    float r=sqrt(u*u-a*a);
    float v=(h*h+1.-b*b)/(2.*h);
    float R=sqrt(v*v-1.);

    L01=Line(0.,1.);
    L12=Circle(u,r,-1.);
    L20=Circle(v,R,-1.);
}


//takes in 3 floats all in (0,1) and puts them into an acceptable triple (a,b,h)
//rules: x is in (0,1): this just becomes a.
//given a, the value of h is constrained to lie in (a,1)
//thus y is sent to h=a+(1-a)y
//given a,h, the radius b is constrained so that the circle endpoints h-b, h+b lie in the
//interval (a,1)
//thus h-b>a, and h+b<1.  Re-arranging, b<h-a, and b<1-h.  Thus b<min(h-a,1-h)
//so we send z to b=min(h-a,1-h)z
vec3 parametersFD(float x, float y, float z){

    float a=x;
    float h=a+(1.-a)*y;
    float b=min(h-a,1.-h)*z;

    return vec3(a,b,h);
}


//measuring the distance tot edes which are exterior to the entire surface fundamental domain
//not drawing the internal edges that we reflect in from the hexagon tile
float edgeDistance(vec2 p){

    float d1=dist(p,C1);
    float d12=dist(p,L12);
    float d2=dist(p,C2);
    float d20=dist(p,L20);
    float d01=dist(p,L01);

    //this is the minimum distance away from any edge that we care about
    float d=min(min(d1,d12),min(d2,d20));

    return d;
}



//------------------------------------------
//reflect points into fundamental domain
//------------------------------------------


//this function takes in a point p, and looks at each side of the fundamental domain
//if p is not within the half space defined by that side, we reflect it
//if p is already in that half space, we leave it alone
void reflectInFD(inout vec2 p,inout float invCount){

    reflectIn(p,C0,invCount);
    reflectIn(p,C1,invCount);
    reflectIn(p,C2,invCount);
    reflectIn(p,L01,invCount);
    reflectIn(p,L12,invCount);
    reflectIn(p,L20,invCount);

}


//while the program's reflection group algorithm will use just the right angled hexagon
//throughout most computation, we will at times want to draw a fundamental domain for the surface
//which consists of 4 hexagons.
//this function reflects in the two internal walls, to help with that
void reflectInternally(inout vec2 p){

    if(!inside(p,C0)){
        invert(p,C0);
    }

    if(!inside(p,L01)){
        invert(p,L01);
    }
}



//this function checks if p is inside our fundamental domain or not
bool insideFD(vec2 p){
    bool within=inside(p,C0);
    within=within&&inside(p,C1);
    within=within&&inside(p,C2);
    within=within&&inside(p,L01);
    within=within&&inside(p,L12);
    within=within&&inside(p,L20);
    return within;
}




//move into the fundamental domain
//this combines the two functions above: it iteratively reflects in the sides,
//then checks if you ended up inside the FD
//if you do, it stops.
void moveToFD(inout vec2 p,inout float invCount){


    for(int i=0;i<25;i++){

        reflectInFD(p,invCount);

        if(insideFD(p)){
            return;
        }

    }

    invCount=-1.;

}





//------------------------------------------
//prepare the screen pixels for computation
//------------------------------------------



//just packing the sinusoidal oscillation which oscillates between a and b into its own function
float osc(float a,float b, float t){
    return abs(b-a)/2.*(1.+sin(t))+a;
}



//this takes in the pixel coordinates on the screen (fragCoord) and rescales
//them to show the appropriate region of the plane
vec2 normalizedFragCoord(vec2 fragCoord){

    // Normalized the pixel coordinates (from -0.5 to 0.5)
    vec2 uv =(fragCoord/iResolution.xy-vec2(0.5));

    //rescale this how you like
    uv = 4.*vec2(1,iResolution.y/iResolution.x)*uv;

    return uv;
}


//starting from Poincare Disk:
vec2 toUHP(vec2 uv){

    //move to half plane
    float Re = 2.*uv.x;
    float Im = 1.-dot(uv,uv);
    vec2 temp=vec2(1.-uv.y,uv.x);
    float Scale = dot(temp,temp);
    vec2 p = 1./Scale*vec2(Re,Im);

    return p;

}


//this function takes coordinates in poincare disk,
//uses mouse position to make a mobius transformation
vec2 mouseTransform(vec2 z){
    if (iMouse.x > 10.0) {
        vec2 m = (2.0*iMouse.xy-iResolution.xy)/iResolution.y;
        // Unit disc inversion
        m /= dot(m,m);
        z -= m;
        float k = (dot(m,m)-1.0)/dot(z,z);
        z *= k;
        z += m;
    }
    return z;
}


//transformations done at setup in the Poincare Disk model
vec2 transformPD(vec2 z){

    if (iMouse.z > 0.) {
        z=mouseTransform(z);
    }
    else{
        //do a rotation slowly
        float c=cos(iTime/6.);
        float s=sin(iTime/6.);
        z=mat2(c,s,-s,c)*z;
    }

    return z;
}



//transformations done in setup to the Upper Half Plane Model
vec2 transformUHP(vec2 p){

    //if there is no mouse press
    if (iMouse.z < 0.) {
        //apply a hyperbolic
        p*=osc(0.4,0.8,iTime/2.);

        //reflect up to the upper half plane:
        p.y=abs(p.y);
    }

    return p;

}



//------------------------------------------
//assigning color to points in the fundamental domain
//------------------------------------------


//get the color of the edges
vec3 edgeColor(vec2 p, bool insideDisk){

    if(insideDisk) return vec3(170,210,255)/255.;
    if(!insideDisk) return 0.35*vec3(140,60,40)/255.;

    return vec3(0.);
}



//get the color for the interior tiles
vec3 tilingColor(float invCount,bool insideDisk){

    vec3 tilingColor;

    if(invCount<0.){
        //if we didnt get into the fundamental domain
        //color it black//BETTER: A DEBUG COLOR
        tilingColor=vec3(0,0,0);
    }

    else {
        //we did get into the fundamental domain:
        float parity=mod(invCount, 2.);

        if (insideDisk){
            if (parity==0.){
                tilingColor=vec3(116, 161, 250)/255.;
            }
            else { //parity=1.
                tilingColor=vec3(120, 170, 250)/255.;
            }
        }

        //if we are outside, make complementary colored.
        else {
            if (parity==0.){
                tilingColor=0.25*vec3(230,129,56)/255.;
            }
            else { //parity=1.
                tilingColor=0.25*vec3(230,99,90)/255.;
            }
        }
    }

    return tilingColor;

}



//get a color for a point in the fundamental domain
vec3 getColor(vec2 p,float invCount,bool insideDisk,bool insideDomain){

    bool onEdge=(edgeDistance(p)<0.05);

    if(onEdge){
        return edgeColor(p, insideDisk);
    }
    else if(insideDomain){
        return tilingColor(invCount,insideDisk)+vec3(0.3,0,0);
    }
    else{
        return tilingColor(invCount,insideDisk);
    }

    return vec3(0.);
}


//------------------------------------------
//making the main image
//------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    //set up the input
    vec2 uv = normalizedFragCoord(fragCoord);

    //keep track of if we start outside the poincare disk
    bool insideDisk=(length(uv)<1.);

    //apply a mobius transformation from mouse position
    //this is done in disk model still
    uv=transformPD(uv);

    //map to upper half plane for computation:
    vec2 p = toUHP(uv);

    //apply some transformations in the UHP model
    p=transformUHP(p);

    //setup the fundamental domain we are working with
    float x=osc(0.1,0.9,iTime/3.);
    float y=osc(0.2,0.8,iTime);
    float z=osc(0.2,0.8,iTime/2.);
    vec3 params=parametersFD(x,y,z);
    setUpFD(params.x,params.y,params.z);


    //before changing p around, separately make a copy to color the original fundamental domain
    vec2 q=p;
    //reflect in the two internal walls: this gets one full copy of the fundamnetal domain
    reflectInternally(q);
    bool insideDomain=insideFD(q)&&insideDisk&&(edgeDistance(q)>0.05);

    //reflect into the fundamental domain
    float invCount=0.;
    moveToFD(p,invCount);

    // color the pixel based on this
    vec3 col=getColor(p,invCount,insideDisk,insideDomain);

    fragColor=vec4(col,1.);
}