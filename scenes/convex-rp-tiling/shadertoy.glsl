const float PI=3.14159;


//------------------------------------------
//Real Projective Reflections
//------------------------------------------


//the structure defining a mirror in real projective space
struct Mirror{
    vec3 halfSpace;
    mat3 reflection;
};


//checking if you are inside a half space with normal vec normal
bool inside(vec3 p, Mirror mirror){
    return dot(p,mirror.halfSpace)>0.;
}



//if p is on the wrong side of the half space, perform the reflection
void reflectIn(inout vec3 p, Mirror mirror,inout float invCount){

    if(!inside(p,mirror)){
        p=mirror.reflection*p;

        //project back down to keep entries small?
        p/=p.z;

        invCount+=1.;
    }
}




//------------------------------------------
//set up the fundamental domain
//------------------------------------------


Mirror M1,M2,M3;


void setupFD(float d){
    //for the 334 triangle group
    //this is computed separately, in mathematica

    float sqrt3=sqrt(3.);

    M1.halfSpace=vec3(0,1,0);
    M1.reflection=mat3(
    1,0,0,
    0,-1,0,
    0,0,1
    );


    M2.halfSpace=vec3(sqrt3,-1.,0);
    M2.reflection=mat3(
    -0.5,sqrt3/2.,0.,
    sqrt3/2.,0.5,0.,
    0.,0.,1.
    );


    M3.halfSpace=vec3(-1./d,-2./sqrt3+1./(sqrt3*d),1.);
    M3.reflection=mat3(
    1.+1./(2.-4.*d)+2./(d-2.),sqrt3/(2.-4.*d), 1./(1.-2.*d)+1./(d-2.)+1./d,
    (7.*d-2.)/(2.*sqrt3*(d-2.)),1./2.,(2.+d*(3.*d-4.))/(sqrt3*d*(d-2.)),
    d*(2.-7.*d)/(4.-10.*d+4.*d*d),sqrt3*d/(4.*d-2.),-d*(1.+d)/(2.-5.*d+2.*d*d)
    );

}


//reflect in each wall of the fundamental domain if needed
void reflectInFD(inout vec3 p,inout float invCount){
    reflectIn(p,M1,invCount);
    reflectIn(p,M2,invCount);
    reflectIn(p,M3,invCount);
}


//this function checks if p is inside our fundamental domain or not
bool insideFD(vec3 p){
    return inside(p,M1)&&inside(p,M2)&&inside(p,M3);
}


//move into the fundamental domain
//this combines the two functions above: it iteratively reflects in the sides,
//then checks if you ended up inside the FD
//if you do, it stops.
void moveToFD(inout vec3 p,inout float invCount){


    for(int i=0;i<30;i++){

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



//"unprojectivize" a point in an affine patch to a representative in R3
vec3 toR3(vec2 p){
    return vec3(p,1.);
}

//project to affine patch z=1
vec2 proj(vec3 p){
    return p.xy/p.z;
}


//this takes in the pixel coordinates on the screen (fragCoord) and rescales
//them to show the appropriate region of the plane
vec2 normalizedFragCoord(vec2 fragCoord){

    // Normalized the pixel coordinates (from -0.5 to 0.5)
    vec2 uv =(fragCoord/iResolution.xy-vec2(0.5));

    //rescale this how you like
    uv = 7.*vec2(1,iResolution.y/iResolution.x)*uv;

    return uv;
}




//------------------------------------------
//coloring the fundamental domain
//------------------------------------------

vec3 tilingColor(float invCount){

    vec3 tilingColor;

    if(invCount<0.){
        //if we didnt get into the fundamental domain
        //color it black//BETTER: A DEBUG COLOR
        tilingColor=vec3(0.2);
        //0.6*vec3(71,58,153)/255.;
    }

    else {

        //we did get into the fundamental domain:
        float parity=mod(invCount, 2.);


        if (parity==0.){
            tilingColor=vec3(116, 161, 250)/255.;
        }
        else { //parity=1.
            tilingColor=vec3(120, 170, 250)/255.;
        }

    }

    return tilingColor;

}



//------------------------------------------
//making the main image
//------------------------------------------



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{


    //set up the input
    vec2 uv = normalizedFragCoord(fragCoord);

    //map into R3
    vec3 p=toR3(uv);

    setupFD(0.89+0.3*sin(iTime));

    //reflect into the fundamental domain
    float invCount=0.;
    moveToFD(p,invCount);

    vec3 col;

    ///if(insideFD(p)){col=vec3(1);}

    // Time varying pixel color
    col = tilingColor(invCount);

    // Output to screen
    fragColor = vec4(col,1.0);
}
