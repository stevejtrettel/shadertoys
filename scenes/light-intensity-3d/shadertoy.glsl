//BUILT FROM THE VOLUMETRIC RAYMARCHER BY FLYGUY //https://www.shadertoy.com/view/XtsGRf

#define RotateX(v,a) v.yz *= mat2(cos(a),sin(a),-sin(a),cos(a))
#define RotateY(v,a) v.xz *= mat2(cos(a),sin(a),-sin(a),cos(a))
#define RotateZ(v,a) v.xy *= mat2(cos(a),sin(a),-sin(a),cos(a))

#define MIN_MARCH_DIST 0.001
#define MAX_MARCH_STEPS 48
#define MAX_VOLUME_STEPS 500
#define VOLUME_STEP_SIZE 0.01








//The following functions define the light intensity in three different homogeneous geometries.
//use the one you would like to visualize in the main Intensity function, directly below their definitions
//right now, they automatically cycle through.


float intensityS2E(vec3 pos){


    float L2=pos.x*pos.x+pos.y*pos.y;
    float r2=L2+pos.z*pos.z;
    float L=sqrt(L2);

    float intensity =abs(L/(r2*sin(L)));

    return intensity;
}

float intensityNil(vec3 pos){



    //Stuff Needed to compute the intensity
    float z=pos.z;
    float L2=pos.x*pos.x+pos.y*pos.y;
    float r2=L2+z*z;
    float z4=z*z*z*z;

    //the denominator of the intensity function factors into two commponents contributing to the brightness
    float intensityLine=2.*r2*sin(z/2.);
    float intensityCurve=(L2*z*cos(z/2.)-2.*r2*sin(z/2.));

    float intensity=abs(z4/(intensityLine*intensityCurve));

    return intensity;
}


float intensitySL2(vec3 pos){

    float z=pos.z;
    float L2=pos.x*pos.x+pos.y*pos.y;

    //first; the components of the cylindrical coordinate polynomials
    float L,L4, L6,z2,z4,z6;
    L=sqrt(L2);
    L4=L2*L2;
    L6=L2*L4;
    z2=z*z;
    z4=z2*z2;
    z6=z2*z4;

    //the hyperbola you lie on
    float k=sqrt(abs(L2-z2));

    //the polynomials coefficients of the area density
    float f1=(L2+z2)/pow(abs(L2-z2),6.);
    float f2=17.*L6+7.*L4*z2+16.*L2*z4+32.*z6;
    float f3=48.*L2*z2*(L2+z2);
    float f4=3.*L4*(5.*L2+3.*z2);
    float f5=L6-2.*L2*z2-z4-L4*(1.+z2);
    float f6=(L6+2.*L2*z2+z4-L4*(z2-1.));
    float f7=2.*L2*(L2+z2)*k;


    //Trigonometric Components
    float c1=cos(k);
    float c2=cos(2.*k);
    float s1=sin(k);
    float s2=sin(k/2.);
    s2*=s2;//now sin(k/2)^2;

    float C1=cosh(k);
    float C2=cosh(2.*k);
    float S1=sinh(k);

    float S2=sinh(k/2.);
    S2*=S2;//now it's sinh(k/2)^2

    //the signs that change depending on formula type:
    float sgn=1.;
    float Sgn=-1.;

    //the area density function, depending on if you are in or out of the lightcone
    float areaDensity;


    if(abs(z)>abs(L)){
        areaDensity=sqrt(abs(f1*s2*(f2 - f3*c1 + f4*c2)*(f5 + f6*c1 + sgn* f7*s1)))/2.;
    }
    else if(abs(z)<abs(L)){
        areaDensity=sqrt(abs(f1*S2*(f2 - f3*C1 + f4*C2)*(f5 + f6*C1 + Sgn*f7*S1)))/2.;
    }


    float intensity=1./areaDensity;

    return intensity;
}




float intensity(vec3 pos,float time){
    // float t=floor(time/6.28);
    // t=mod(t,3.);

    //switch(int(t)){
    //case 0:return 1.5*intensityS2E(pos);

    // case 1:return 1.5*intensityNil(pos);

    // case 2:return 1.5*intensitySL2(pos);
    // }
    return 10.5*intensitySL2(pos);
    // return 1.5*intensityNil(pos);
    // return 1.5*intensityS2E(pos);
}














vec4 Volume(vec3 pos,float opacity)
{
    //rotate starting position
    RotateY(pos,iTime/3.);
RotateZ(pos,-0.5);

    pos=15.*pos;//fixed zoom level
    //pos=(15.-5.*cos(iTime/4.))*pos;//zoom in and out

    //calculate the light intensity;

    float vol =2.*intensity(pos,iTime/5.);

    //mix two colors together: first is for lower intensity second is high intensity
    vec3 col = mix(vec3(0.85,0.45,0.2),vec3(1.,1.,0.6),step(3.,vol));

    vol = smoothstep(0.6,0.9,abs(vol));

    return vec4(col, max(0.0,vol)*0.01*opacity);
}

vec3 MarchVolume(vec3 orig, vec3 dir)
{
    //Ray march to find the region surface.
    float t = 0.0;
    vec3 pos = orig;

    float radius=3.;
    float opacity=1.;//fixed size of bounding sphere
    //float radius=1.5*(1.-cos(iTime/5.));//make the bounding sphere get larger with time
    //float opacity=3.5/(0.5+radius);


    for(int i = 0;i < MAX_MARCH_STEPS;i++)
    {
        pos = orig + dir * t;
        float dist = 100.0;


        dist = min(dist, 8.0-length(pos));
        dist=min(dist,length(pos)-radius);
        // dist = min(dist, max(max(abs(pos.x),abs(pos.y)),abs(pos.z))-1.0);//cube

        t += dist;

        if(dist < MIN_MARCH_DIST){
            orig=pos;//reset the origin to your new point
            t=0.;//reset the marching counter
            break;}//you made it to the region! Start volume march
    }


    //Step though the volume and add up the opacity.
    vec4 col = vec4(0.0);
    for(int i = 0;i < MAX_VOLUME_STEPS;i++)
    {
        t += VOLUME_STEP_SIZE;

        pos = orig + dir * t;

        //Stop if the sample leaves the volume.
        //if(max(max(abs(pos.x),abs(pos.y)),abs(pos.z))-radius > 0.0) {break;}//cube
        if(length(pos)>radius) {break;}//sphere


        //if you are rendering a shell: add up zero intensity when you are inside the shell
        // if(length(pos)>radius-0.2)//uncomment to make the below only apply in the shell
        {
            vec4 vol = Volume(pos,opacity);
            vol.rgb *= vol.w;
            //distance foog
            vol.rgb=exp(-t/3.)*vol.rgb;//weight by the distance fog travelled to get here.
            col += vol;}
    }


    return col.rgb;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 res = iResolution.xy / iResolution.y;
    vec2 uv = fragCoord.xy / iResolution.y;

    vec3 dir = normalize(vec3(uv-res/2.0,1.0));
    vec3 orig = vec3(0,0,-4.);

    RotateX(dir,radians(iMouse.y));
RotateX(orig,radians(iMouse.y));
RotateY(dir,radians(-iMouse.x));
RotateY(orig,radians(-iMouse.x));

    vec3 color = MarchVolume(orig,dir);

    fragColor = vec4(color, 1.0);
}
