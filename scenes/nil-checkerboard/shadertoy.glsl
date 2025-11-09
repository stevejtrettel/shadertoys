//this will can be a parameter in the geodesic flow later.
float param;


//flow by nil geodesics towards the xy plane.
vec3 flow(vec3 eye, vec3 dir,float t){

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
vec3 findPlane(vec3 eye, vec3 dir, float dist,float stp){

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

vec3 trace(vec3 eye, vec3 dir){

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
    return endPt;
}


vec4 checkerboard(vec3 p,vec2 offset,float size){
    float x=mod(size*p.x+offset.x,2.);
    float y=mod(size*p.y+offset.y,2.);


    vec3 color=vec3(0.);

    //what to do if we hit the plane in the at z=0
    if(abs(p.z)<0.5){
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1.);}
    }

    return vec4(color,1.);
}


//adjust the color computed at p by a fog:
vec4 fog(vec3 p,vec4 color){
    float r=length(p.xy);
    return exp(-r*r/50.)*color;
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

    //can only move your eye up and down on the z-axis so that
    //everything is Euc translations and the geodesics are right.
    float start=8.;
    float spread=4.;

    return vec3(0,0,start+spread*cos(time/2.));
}

//initial starting direction in spherical coordinates in your tangent space:
vec2 eyeDirection(float time){
    float theta=0.;
    float phi=(sin(time)-1.)+0.2;
    return vec2(theta,phi);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 dir = rayDirection(120.0, iResolution.xy, fragCoord);

    //give the initial direciton you look in as a funciton of theta/phi
    //in the spherical coords on your tangent space.
    vec2 eyeDir=eyeDirection(iTime);
    dir=rotateView(eyeDir,dir);
    vec3 eye = eyePosition(iTime);

    vec3 endPt=trace(eye,dir);

    vec2 offset=vec2(0.2,0.1);
    vec4 color=checkerboard(endPt,offset,2.);
    color=fog(endPt,color);

    fragColor = color;
}
