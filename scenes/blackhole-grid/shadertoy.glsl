
bool eventHorizon;
float M;
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

    //translate by black hole position
    vec3 r=S.pos-bhPos;
    vec3 v=S.dir;

    dState dS;
    //copy over velocity: the equation below
    //is a trajectory of the form x''=f(x) so this is the standard
    //trick to turnr it into a system of first order equations
    dS.vel=v;

    //now compute acceleration:


    //the schwarzschild solution is time invarirant, so, we are focused on
    //drawing the view of an observer stationary w.r.t. coordinates,
    //we can project off the time direction, and look at the projection of
    //lightlike geodesics onto xyz space slices of constant time.

    //different coordinate systems give different ODES: schwarzchild coordinates
    //give a system with coordinate singularities at the event horizon AND pole phi=0 axis
    //instead, we convert to a system of eqns in XYZ coords

    //things turn out after some work to be quite simple: each trajectory has a constnat
    //of motion: angular momentum L.  For that fixed L, we can write an ODE for the trajectory
    //in terms of a force field F_L(x) on RR^3: that is, projections of timelike geodesics
    //solve x''(t)=F_L(x(t)) (this is not a real force, just a way to think about this ODE)
    //this acceleration is F_L(x)=-(3/2 M L^2/R^5)*(x,y,z)
    //where R is the length of xyz

    float R=length(r);

    vec3 l=cross(r,v);
    float L=length(l);

    float mag=3./2.*M*L*L/(R*R*R*R*R);

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

    //move the point a little
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

    //distance to the black hole:
    R=length(S.pos-bhPos)-2.*M;
    //set step size to large if far from black hole, and small if close
    if(R>5.){bhDT=1.;}
    else{bhDT=(R/5.)*(R/5.)*0.5+0.01;}
    //  bhDT=max(R/2.,0.001);


    //shrink when you approach the boundary
    //so you don't massively overstep it

    //this is for a sphere of radius sceneRad
    //R=sceneRad-length(S.pos);

    //this is for a plane at z=-planeOffset
    R=S.pos.z+planeOffset;


    //this is for a cylinder of radius same as sphere:
    //R=sceneRad-length(S.pos.xz);

    sceneDT=max(R/2.,0.001);

    dt=min(bhDT,sceneDT);
    dt=min(1.,dt);

    return dt;


}



void trace(inout state S){

    float dt;

    //iteratively step through rk4
    for(int n=0;n<350;n++){

        //setting some sort of adaptive dt
        dt=setDT(S);

        //do a step of rk4
        //euler(S,dt);
        rk4(S,dt);

        //if you hit the event horizon, stop.
        if(length(S.pos-bhPos)<2.*M){
            eventHorizon=true;
            break;
        }

        //if you pass the back plane stop
        if(S.pos.z<-49.5){break;}
    }

}



vec4 gridlines(state S,float size){
    float x=mod(S.pos.x/size+iTime/2.,2.);
    float y=mod(S.pos.y/size,2.);
    vec3 color;


    color=vec3(1.);

    float mag=clamp(10./(50.*x*(2.-x)*y*(2.-y)),0.,10.);

    color*=mag;



    return vec4(color,1.);
}


vec4 checkerboard(state S,float size){
    float x=mod(S.pos.x/size+iTime/2.,2.);
    float y=mod(S.pos.y/size,2.);
    vec3 color;


    //if you hit the plane in front of us
    if(S.dir.z<0.){

        color=vec3(0.);
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1.);}

    }


    //if you turn around and hit the plane behind us!
    if(S.dir.z>0.){

        color=vec3(0.,0.,0.);
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1,0,0);}

    }
    //rescale color brightness by distance along xy plane (ie the z component of direction):
    // color*=clamp(abs(2.*S.dir.z),0.,1.);


    return vec4(color,1.);
}


vec4 sphGrid(state S){
    vec3 color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=30.;

    float theta=atan(S.dir.z,S.dir.x)+iTime/40.;
    float phi=acos(S.dir.y);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*phi/6.28,2.);


    float mag=clamp(10./(50.*x*(2.-x)*y*(2.-y)),0.,10.);

    color*=mag;


    //if instead you want a checkerboard:
    color=vec3(0.);
    if(y<1.&&x<1.||y>1.&&x>1.){color=vec3(1.);}



    return vec4(color,1.);
}



vec4 cylGrid(state S){
    vec3 color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=20.;

    float theta=atan(S.dir.z,S.dir.x)+iTime/20.;
    float z=acos(S.dir.y);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*z/6.28,2.);


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


//intial starting location of your eye (should be along z axis).
vec3 eyePosition(float time){
    return vec3(0.,0.,10.);
    //return vec3(15.*cos(time),0,30.*sin(time));
}


vec3 bhPosition(float time){
    return vec3(15.*cos(time),0,30.*sin(time));
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    eventHorizon=false;

    //set the initial state
    vec3 dir = rayDirection(90.0, iResolution.xy, fragCoord);
    vec3 eye = eyePosition(iTime);
    state S=state(eye,dir);

    //set the black hole's mass:
    M=3.;

    //set the black hole's position:
    bhPos=bhPosition(iTime/2.);

    //do the actual raytracing
    trace(S);
    if(eventHorizon){
        fragColor=vec4(0.);
        return;
    }

    //else, make the color
    vec4 color;
    // color=sphGrid(S);}
    color=checkerboard(S,8.);
    // color=cylGrid(S);



    fragColor = color;
}
