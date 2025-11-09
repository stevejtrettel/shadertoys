bool eventHorizon;
float M=0.5;
vec3 bhPos;

//a position and velocity
struct state{
    vec3 pos;
    vec3 dir;
};


//derivative of initial condition: velocity and acceleration
struct dState{
    vec3 vel;
    vec3 acc;
};


//adding velocity /acceleration pairs
dState add(dState s1,dState s2){
    vec3 vel=s1.vel+s2.vel;
    vec3 acc=s1.acc+s2.acc;
    dState sum;
    sum.vel=vel;
    sum.acc=acc;
    return sum;
}



//scaling an acceleration /velocity pair
dState scale(dState dS,float k){
    dS.vel*=k;
    dS.acc*=k;
    return dS;
}


//evolve a state in time by dS for size stp
state nudge(state S, dState dS,float stp){
    S.pos+=dS.vel*stp;
    S.dir+=dS.acc*stp;
    return S;
}





//this is the function which sets up the dynamics for the system
//can put any 2nd order ODE in here
dState stateDeriv(state S){
    vec3 r=S.pos-bhPos;
    vec3 v=S.dir;

    dState dS;
    //copy over velocity
    dS.vel=v;

    //now compute acceleration:
    //this is for a vector field whose trajectories coincide with schwarzchild geodesics:
    float R=length(r);

    vec3 l=cross(r,v);
    float L=length(l);

    float mag=3.*M*L*L/(R*R*R*R*R);

    //set the acceleration
    dS.acc=-mag*r;
    //dS.acc=vec3(0.);
    return dS;

}




void euler(inout state S,float dt){

    dState dS;
    dS=stateDeriv(S);
    S=nudge(S,dS,dt);
}





void rk4(inout state S,float dt){
    //constants computed during the process
    dState k1,k2,k3,k4;
    state tempS;

    //get the derivative
    k1=stateDeriv(S);
    k1=scale(k1,dt);

    //move the point a littkle
    tempS=nudge(S,k1,0.5);
    k2=stateDeriv(tempS);
    k2=scale(k2,dt);

    //get k3
    tempS=nudge(S,k2,0.5);
    k3=stateDeriv(tempS);
    k3=scale(k3,dt);

    //get k4
    tempS=nudge(S,k3,1.);
    k4=stateDeriv(tempS);
    k4=scale(k4,dt);

    //add up results:
    dState total=scale(k1,1.);
    total=add(total,scale(k2,2.));
    total=add(total,scale(k3,2.));
    total=add(total,k4);
    total=scale(total,1./6.);

    //the state S has been reset to the endpoint;
    S=nudge(S,total,1.);

}




//make the step size adaptive so it is only small //
//near the black hole, and then again as you approach
// the scene boundary as a cheap way to not overshoot
float setDT(state S){

    float dt,R,bhDT,sceneDT;
    float sceneRad=50.;//radius of outer sphere;
    float planeOffset=50.;//how far back the plane is

    //shrink when you get near the black hole
    R=length(S.pos-bhPos)-2.*M;
    bhDT=max(R/2.,0.001);


    //shrink when you approach the boundary
    //so you don't massively overstep it

    //this is for a sphere of radius sceneRad
    R=sceneRad-length(S.pos);

    //this is for a plane at z=-planeOffset
    //R=S.pos.z+planeOffset;


    //this is for a cylinder of radius same as sphere:
    //R=sceneRad-length(S.pos.xz);

    sceneDT=max(R/2.,0.);

    dt=min(bhDT,sceneDT);
    dt=min(1.,dt);

    return dt;


}



void trace(inout state S){

    float dt;

    //iteratively step through rk4
    for(int n=0;n<50;n++){

        //setting some sort of adaptive dt
        dt=setDT(S);

        //do a step of rk4
        //euler(S,dt);
        rk4(S,dt);

        if(length(S.pos-bhPos)<2.*M){
            eventHorizon=true;
            break;
        }

        if(length(S.pos)>50.){break;}


    }

}






vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 hue(float x){
    return  pal(x, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
}




vec4 checkerboard(state S,float size){
    float x=mod(S.pos.x/size+iTime/2.,2.);
    float y=mod(S.pos.y/size,2.);

    vec3 color=vec3(0.);
    if(y<1.&&x<1.||y>1.&&x>1.)
    {color=vec3(1.);}

    return vec4(color,1.);
}


vec4 sphGrid(state S){
    vec3 color;
    //  color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=50.;

    float theta=atan(S.dir.y,S.dir.x)+iTime/40.;
    float phi=acos(S.dir.z);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*phi/6.28,2.);


    float mag=clamp(5./(50.*x*(2.-x)*y*(2.-y)),0.,10.);

    //color*=mag;


    //if instead you want a checkerboard:
    // color=vec3(0.);
    // if(y<1.&&x<1.||y>1.&&x>1.){color=hue(theta/2.+iTime/5.);}


    color=mag*hue(theta/2.+iTime/5.);
    return vec4(color,1.);
}



vec4 cylGrid(state S){
    vec3 color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=20.;

    float theta=atan(S.dir.z,S.dir.x)+iTime/20.;
    float z=tan(3.14/2.*S.dir.y);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*z/10.,2.);


    //if instead you want a checkerboard:
    color=vec3(0.);
    if(y<1.&&x<1.||y>1.&&x>1.){color=vec3(1.);}


    return vec4(color,1.);
}

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 *
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}



//viewDir is based around looking down the z-axis: this rotates coordinates
//so the screen center is instead facing forwardVec
vec3 rotateView(vec2 sphCoords,vec3 dir){

    float theta=sphCoords.x;
    float phi=sphCoords.y;


    vec3 tempDir;
    //first, rotate up in the phi direction, fixing the x axis:
    tempDir.x=dir.x;

    tempDir.z= cos(phi)*dir.z-sin(phi)*dir.y;
    tempDir.y= sin(phi)*dir.z+cos(phi)*dir.y;


    vec3 newDir;
    //now rotate about the z-axis
    newDir.z=tempDir.z;
    newDir.x=cos(theta)*tempDir.x-sin(theta)*tempDir.y;
    newDir.y=sin(theta)*tempDir.x+cos(theta)*tempDir.y;

    return newDir;
}


//intial starting location of your eye (should be along z axis).
vec3 eyePosition(float time){
    float rad=5.*(1.25+sin(time))/2.;
    return rad*vec3(4.*sin(time),4.*cos(time)-0.,0.);

}

vec3 eyeTangent(float time){

    //derivative of the formula above:
    vec3 tang= normalize(vec3(3.*cos(time),-3.*sin(time),0.));

    //now make it point a little bit inwards to the black hole:
    //vec3 pos=eyePosition(time)/10.;
    //tang=tang-0.1*pos;
    // return vec3(-1.,0.,0.);
    return normalize(tang);
}

vec2 toSpherical(vec3 dir,float time){
    float theta;
    float phi;

    theta=atan(dir.y,dir.x);
    phi=acos(dir.z);

    return vec2(theta+0.5*sin(time),phi);
}

//initial starting direction in spherical coordinates in your tangent space:
vec2 eyeDirection(float time){


    //use the tangent vector to your orbit;



    float theta=0.;
    float phi=0.;
    return vec2(theta,phi);
}



vec3 bhPosition(float time){

    return vec3(0.,0.,0.);
}

float bhMass(float time){
    return 0.5;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    eventHorizon=false;

    //set the initial state
    vec3 dir = rayDirection(90.0, iResolution.xy, fragCoord);


    vec3 eye = eyePosition(iTime/2.);
    vec2 eyeDir=toSpherical(eyeTangent(iTime/2.),iTime/2.);
    // vec2 eyeDir=eyeDirection(iTime);
    dir=rotateView(eyeDir,dir);





    state S=state(eye,dir);

    //set the black hole's mass:
    M=bhMass(iTime);

    //set the black hole's position
    bhPos=bhPosition(iTime);

    //do the actual raytracing
    trace(S);
    if(eventHorizon){
        fragColor=vec4(0.);
        return;
    }

    //else, make the color
    vec2 offset=vec2(0.2+iTime,0.1);
    vec4 color;
    if(eventHorizon){color=vec4(0.);}
    else{
        color=sphGrid(S);}
    // color=checkerboard(S,8.);}
    //color=cylGrid(S);}


    fragColor = color;
}
