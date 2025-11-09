//A tiling of the hyperbolic plane by ideal quadrilaterals determines a punctured torus
//by taking each pair of opposite sides, and gluing them with the hyperbolic isometry
// which identifies the closest pair of points on each to one another.
//To draw this tiling, instead of translating by these isometries,
//I generate it by reflecting in the sides




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




//------------------------------------------
//set up the fundamental domain
//------------------------------------------


//Give names to the sides of the shape
Line side0;
Line side1;
Circle side2;
Circle side3;


//function that defines these sides in terms of two deformation parameters a,b
//this generates a quadrilateral with vertices at infinity, -a, 0 and b.
void setUpFD(float a, float b){

    side0=Line(-1.*a,1.);
    side1=Line(b,-1.);
    side2=Circle(-a/2.,a/2.,-1.);
    side3=Circle(b/2.,b/2.,-1.);

}



//------------------------------------------
//reflect points into fundamental domain
//------------------------------------------


//this function takes in a point p, and looks at each side of the fundamental domain
//if p is not within the half space defined by that side, we reflect it
//if p is already in that half space, we leave it alone
void reflectInFD(inout vec2 p,inout float invCount){


    if(!inside(p,side0)){
        invert(p,side0);
        invCount+=1.;
    }

    if(!inside(p,side1)){
        invert(p,side1);
        invCount+=1.;
    }

    if(!inside(p,side2)){
        invert(p,side2);
        invCount+=1.;
    }

    if(!inside(p,side3)){
        invert(p,side3);
        invCount+=1.;
    }

}



//this function checks if p is inside our fundamental domain or not
bool insideFD(vec2 p){
    return inside(p,side0)&&inside(p,side1)&&inside(p,side2)&&inside(p,side3);
}




//move into the fundamental domain
//this combines the two functions above: it iteratively reflects in the sides,
//then checks if you ended up inside the FD
//if you do, it stops.
void moveToFD(inout vec2 p,inout float invCount){


    for(int i=0;i<20;i++){

        reflectInFD(p,invCount);

        if(insideFD(p)){
            break;
        }

    }
}





//------------------------------------------
//prepare the screen pixels for computation
//------------------------------------------


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
//if you want to draw this picture in the half plane (where we did the computation)
//simply delete the contents of this function and just have it "return uv"
vec2 toUHP(vec2 uv){

    //do a rotation slowly
    float c=cos(iTime/5.);
    float s=sin(iTime/5.);
    uv=mat2(c,s,-s,c)*uv;


    //move to half plane
    float Re = 2.*uv.x;
    float Im = 1.-dot(uv,uv);
    vec2 temp=vec2(1.-uv.y,uv.x);
    float Scale = dot(temp,temp);
    return 1./Scale*vec2(Re,Im);


    //return uv;
}


//just packing the sinusoidal oscillation which oscillates between a and b into its own function
float osc(float a,float b, float t){
    return abs(b-a)/2.*(1.+sin(t))+a;
}




//------------------------------------------
//making the main image
//------------------------------------------

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    //set up the input
    vec2 uv = normalizedFragCoord(fragCoord);

    //if you are outside the poincare disk, make black
    if(length(uv)>1.){
        fragColor=vec4(0,0,0,1);
        return;
    }

    //map to upper half plane for computation:
    vec2 p = toUHP(uv);

    //setup the fundamental domain we are working with
    setUpFD(osc(0.01,1.,iTime/3.),osc(0.5,2.5,iTime/1.));

    //reflect into the fundamental domain
    float invCount=0.;
    moveToFD(p,invCount);

    // color the pixel based on this
    //right now this is a very boring coloring:
    //we just count if theres an even or odd number of reflections!
    float evenOdd=mod(invCount,2.);
    vec3 col=vec3(0.3,0.6-evenOdd,evenOdd);

    // Output to screen
    fragColor = vec4(col,1.0);
}
