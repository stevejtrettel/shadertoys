


//======== TRACING THE XY PLANE ================
//==================================================

//parameter in the geodesic flow
float xi=1.;
float fov=120.;


//flow by nil geodesics towards the xy plane.
vec3 flow(vec3 eye, vec3 dir,float t){

    //get a and c and alpha:
    float c=dir.z;
    float a=length(dir.xy);
    float alpha=atan(dir.y,dir.x);

    //give geodesic
    float x=(a*sin(c*t*xi+alpha)-a*sin(alpha))/(c*xi);

    float y=(a*cos(c*t*xi+alpha)-a*cos(alpha))/(c*xi);
    float z=((a*a*c+2.*c*c*c)*t*xi-a*a*sin(c*xi*t))/(2.*c*c*xi);

    return eye+vec3(x,y,z);
}


vec3 flow2(vec3 eye, vec3 dir,float t){

    //get a and c and alpha:
    float c=dir.z;
    float a=length(dir.xy);
    float alpha=atan(dir.y,dir.x);

    //give geodesic
    float x=2.*a/c*sin(c*t/2.)*cos(c*t/2.+alpha);
    float y=2.*a/c*sin(c*t/2.)*sin(c*t/2.+alpha);
    float z=c*t+0.5*a*a*(c*t-sin(c*t))/(c*c);

    return eye+vec3(x,y,z);
}



//are you above the plane?
bool abovePlane(vec3 pos){
    if(pos.z>0.){return true;}
    else{return false;}
}

//given the initial conditions AND a distance just before
//impacting the plane, do a binary search to find the plane:
vec3 findPlane(vec3 eye, vec3 dir, inout float dist,float stp){

    //flowing dist doesnt hit the plane, dist+step does:
    float testDist=stp;

    for(int i=0;i<8;i++){

        //divide the step size in half
        testDist=testDist/2.;

        //if you are still above the plane, add to distance.
        if(abovePlane(flow(eye,dir,dist+testDist))){
            dist+=testDist;
        }
        //if not, then don't add: divide in half and try again

    }

    return flow(eye,dir,dist);


}

vec3 trace(vec3 eye, vec3 dir,inout float totalDist){

    float stp=1.;
    float dist=0.;

    vec3 endPt=eye;

    //keep flowing along at fixed step size till you hit the plane.
    for(int count=0;count<50;count++){

        dist+=stp;
        endPt=flow(eye,dir,dist);
        //check if you hit the plane
        if(!abovePlane(endPt)){
            break;}
    }


    //if you return here, that means dist is set to be right after you step past the plane:
    dist=dist-stp;//right before you hit the plane.

    //now do binary search to find the plane.
    endPt=findPlane(eye,dir,dist,stp);


    //return the point which actually lies on the plane.
    totalDist=dist;
    return endPt;
}




//======== COLORING THE PLANE ================
//==================================================


vec3 checkerboard(vec3 p,vec2 offset,float size){
    float x=mod(size*p.x+offset.x,2.);
    float y=mod(size*p.y+offset.y,2.);

    vec3 color=vec3(0.);

    //what to do if we hit the plane in the at z=0
    if(abs(p.z)<0.5){
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1.);}
    }

    return color;
}




//adjust the color computed at p by a fog:
vec3 fog(vec3 p,vec3 color){
    float r=length(p.xy);

    float s=1./50.;
    float fogginess=exp(-r*r*s);
    return fogginess*color;
}



//======== SETTING UP THE VIEW ETC ================
//==================================================


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


//mostly linear but zero deriv at beginning and end

float smoothTransition(float x){
    if(x<0.){return 0.;}
    else if(x>1.){return 1.;}
    else{
        return 3.*x*x-2.*x*x*x;
    }
}




//======== TIMING FOR THE ANIMATION ================
//==================================================

//setting time intervals:
float totalTime=6.28;
float time1;
float time2;
float time3;
float time4;

void setTimes(){
    time1=0.25*totalTime;
    time2=0.5*totalTime;
    time3=0.75*totalTime;
    time4=totalTime;
}



//intial starting location of your eye (should be along z axis).
vec3 eyePosition(float time){

    //can only move your eye up and down on the z-axis so that
    //everything is Euc translations and the geodesics are right.

    float h,x;

    float eucHeight=3.;
    float deltaHeight=10.;


    time=mod(time,totalTime);

    //start at a constant height while you turn your head up
    if(time<time1){
        h=eucHeight;
    }

    //then move upwards as you distort the metric, and turn your head back down
    else if(time<time3){
        x=(time-time1)/(time3-time1);
        h=eucHeight+deltaHeight*pow(smoothTransition(x),4.);

    }

    //then move back downwards to the origin height.
    else{
        x=(time-time3)/(time4-time3);
        h=eucHeight+deltaHeight-deltaHeight*smoothTransition(x);
    }


    return vec3(0.,0.,h);

}



//initial starting direction in spherical coordinates in your tangent space:
vec2 eyeDirection(float time){

    //no rotation in the xy plane: the twisting geodesics does enough of that!
    float theta=0.;
    //just raise our head up and down.
    float phi;

    time=mod(time,2.*3.14);

    //turn your head up
    if(time<time1){
        phi=-smoothTransition(time/time1)*3.14/3.;
    }

    //lower your head as you change the metric
    else if(time<time3){
        float x=(time3-time)/(time3-time1);
        phi=-3.14/3.*smoothTransition(x);
    }

    //be looking straight down for the descent
    else{
        phi=0.;
    }


    return vec2(theta,phi);
}


float nilify(float time){
    //change the metric parameter between 0 and 1
    float xi;


    time=mod(time,2.*3.14);

    if(time<time1){
        //euclidean space (don't divide by zero!)
        xi=0.0001;
    }

    else if(time>time1 &&time<time2){
        //smoothly interpolate until nil
        xi=smoothTransition((time-time1)/(time2-time1));
    }

    else if(time>time2&&time<time3){
        //stay nil
        xi=1.;
    }

    else{
        //smoothly interpolate back to euclidean
        xi=smoothTransition(((time4-time)/(time4-time3)));
    }


    return xi;
}



//adjust the color computed at p by a fog:
vec3 animateFog(vec3 p,vec3 color,float time){
    float r=length(p.xy);

    time=mod(time,totalTime);
    float s=(time/totalTime)*(1.-time/totalTime);
    s=s/30.;

    float fogginess=exp(-r*r*s);
    return fogginess*color;
}




//======== ANTI-ALIASING ================
//==================================================


//given eye position, direction and distance, get checker color
vec3 getChecker(vec3 eye, vec3 dir, float dist){
    float size=2.;
    vec2 offset=vec2(0.1,0.2);
    vec3 p=flow(eye, dir, dist);
    return checkerboard(p,offset,size);
}


//set the initial direction from fragCoord
vec3 tVector(vec2 fragCoord,float time){

    vec3 dir = rayDirection(fov, iResolution.xy, fragCoord);
    //give the initial direciton you look in as a funciton of theta/phi
    //in the spherical coords on your tangent space.
    vec2 eyeDir=eyeDirection(time);
    dir=rotateView(eyeDir,dir);

    return dir;
}



vec3 getColor(vec2 fragCoord,float time){

    float dist;

    //set the geometry
    xi=nilify(time);

    //do the original tracing to get the distance:
    vec3 eye=eyePosition(time);
    vec3 dir=tVector(fragCoord,time);

    //find the point on the plane you reach after raytracing
    vec3 endPt=trace(eye,dir,dist);

    //offset to the checkerboard pattern to adjust
    vec3 color=getChecker(eye,dir,dist);

    //fog is off at beginning and end, on in middle
    color=animateFog(endPt,color,time);

    return color;
}


vec3 spaceAA(vec2 fragCoord,float time){

    float dist;

    //set the geometry
    xi=nilify(time);

    //do the original tracing to get the distance:
    vec3 eye=eyePosition(time);
    vec3 dir=tVector(fragCoord,time);
    vec3 endPt=trace(eye,dir,dist);
    //now distance is saved:

    //size of NxN grid to sample over
    int N=2;
    float n=float(N);
    float sq=float((2*N+1)*(2*N+1));
    vec3 color=vec3(0.);
    vec3 newDir;

    for(int i=-N;i<N+1;i++){
        for(int j=-N;j<N+1;j++){
            newDir=tVector(fragCoord+vec2(i,j)/n,time);
            color+=getChecker(eye,newDir,dist);
        }

    }

    return color/sq;
}




vec3 timeAA(vec2 fragCoord,float time,int T){

    //T=length of time to sample over
    //size of a timestep (should be related to frames...)
    float stp=0.002;
    float t=float(T);

    float newTime;
    vec3 color=vec3(0.);
    vec3 newDir;
    float dist;

    //set the geometry
    xi=nilify(time);

    //do the original tracing to get the distance:
    vec3 eye=eyePosition(time);
    vec3 dir=tVector(fragCoord,time);
    vec3 endPt=trace(eye,dir,dist);
    //now distance is saved:

    //now iterate over a time interval, and take the average color
    for(int k=-T;k<T+1;k++){
        newTime=time+stp*float(k);
        xi=nilify(newTime);
        eye=eyePosition(time);
        newDir=tVector(fragCoord,newTime);
        color+=getChecker(eye,newDir,dist);
    }

    color=color/(2.*t+1.);

    color=animateFog(endPt,color,time);

    return color;

}


vec3 SpaceTimeAA(vec2 fragCoord,float time){


    //length of time to sample over
    int T=5;
    float stp=0.002;
    float t=float(T);

    //chunk of space to sample over
    int N=2;
    float n=float(N);
    float sq=float((2*N+1)*(2*N+1));

    //other variables
    float newTime;
    vec3 newDir;
    float dist;
    vec3 color=vec3(0.);


    //set the geometry
    xi=nilify(time);

    //do the original tracing to get the distance:
    vec3 eye=eyePosition(time);
    vec3 dir=tVector(fragCoord,time);
    vec3 endPt=trace(eye,dir,dist);
    //now distance is saved:

    //now iterate over a time interval, and take the average color
    for(int k=-T;k<T+1;k++){
        newTime=time+stp*float(k);
        xi=nilify(newTime);

        //now, for each time interval, interate over some space-pixels:
        for(int i=-N;i<N+1;i++){
            for(int j=-N;j<N+1;j++){
                eye=eyePosition(time);
                newDir=tVector(fragCoord+vec2(i,j)/n,time);
                color+=getChecker(eye,newDir,dist);
            }
        }
    }

    color=color/sq;
    color=color/(2.*t+1.);
    color=animateFog(endPt,color,time);

    return color;




}


//======== MAKING THE IMAGE ================
//==================================================

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    //set the animation time cutoffs
    setTimes();
    fov=120.;

    vec3 color;

    //get the color of the pixel at fragCoord at the time iTime.
    color=timeAA(fragCoord,iTime,5);

    fragColor = vec4(color,1.);
}
