//BUILT FROM THE VOLUMETRIC RAYMARCHER BY FLYGUY //https://www.shadertoy.com/view/XtsGRf

#define RotateX(v,a) v.yz *= mat2(cos(a),sin(a),-sin(a),cos(a))
#define RotateY(v,a) v.xz *= mat2(cos(a),sin(a),-sin(a),cos(a))
#define RotateZ(v,a) v.xy *= mat2(cos(a),sin(a),-sin(a),cos(a))

#define MIN_MARCH_DIST 0.001
#define MAX_MARCH_STEPS 48
#define MAX_VOLUME_STEPS 500
#define VOLUME_STEP_SIZE 0.02

#define MAX_POLYNOMIAL_ORDER 5

// XY range of the display.
#define DISP_SCALE 130.0 

#define PI 3.14159265359

// Kronecker delta
#define kd(n, k) ((n == k) ? 1.0 : 0.0)


float factorial(int n){
    int k=1;
    for(int i=1;i<n+1;i++){
        k*=i;
    }
    return float(k);
}



//Color Palettes from https://www.shadertoy.com/view/ll2GD3
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos((c*t+d) );
}


//Algorithms for Polynomials from tpfto:
//https://www.shadertoy.com/view/tlX3WN
// Clenshaw's algorithm for the Laguerre polynomial
float laguerre(int n, int aa, float x)
{
	float a = float(aa);
    float u = 0.0, v = 0.0, w = 0.0;
    
    for (int k = MAX_POLYNOMIAL_ORDER; k > 0; k--)
    {
        float kk = float(k);
        w = v; v = u;
        u = kd(n, k) + (2.0 * kk + a + 1.0 - x)/(kk + 1.0) * v - (kk + a + 1.0) * w/(kk + 2.0);
    }
    
    return kd(n, 0) + (a - x + 1.0) * u - 0.5 * (a + 1.0) * v;
}

// Clenshaw's algorithm for the normalized associated Legendre polynomial (spherical harmonics)
float alegp(int n, int m, float x)
{
    int am = abs(m);
    float u = 0.0, v = 0.0, w = 0.0;
    
    for (int k = MAX_POLYNOMIAL_ORDER; k >= 0; k--)
    {
        float kp = float(k + 1);
        float mk1 = float(2 * am) + kp, mk2 = float(2 * (am + k) + 1);
        w = v; v = u;
        u = kd(n, am + k) + sqrt((mk2 * (mk2 + 2.0))/(kp * mk1)) * x * v - sqrt((kp * mk1 * (mk2 + 4.0))/((kp + 1.0) * (mk1 + 1.0) * mk2)) * w;
    }

    for (int k = 1; k <= am; k++)
    {
        u *= sqrt((1.0 - 0.5/float(k)) * (1.0 - x) * (1.0 + x));
    }
    
    return (((m > 0) && ((am & 1) == 1)) ? -1.0 : 1.0) * u * sqrt((0.5 * float(am) + 0.25)/PI);
}






 // calculating the wave function Psi with quantum numbers n,l,m

vec4 amplitude(ivec3 qNum, vec3 pos)
{
      
   	  int n=qNum.x;
      int l=qNum.y;
      int m=qNum.z;
    
    
      float r = length(pos);
      float rho = 2. * r/float(n);
    
    //independent of m
      float radialComp = exp(1.0 * float(l + 1) * log(0.5*rho) - rho/2.)*
          					laguerre(n - l - 1, 2 * l + 1, rho);
    
     //depends only on abs(m)
      float harmonicComp= alegp(l, m, pos.z/r);//pos.z/r=cosLat
    
          float harmonicComp2= alegp(l, m, pos.x/r);//pos.z/r=cosLat
    
    
    //makes total density =1
      float normalization=1.;
          //5.*sqrt(factorial(n - l - 1)/factorial(n + l));
          //normalization=sqrt((2.*float(l)+1.)*factorial(l-m)/(4.*PI*factorial(l+m)));
      
   
      float psi=normalization*radialComp*harmonicComp;//real part of Psi
    
    float psi2=normalization*radialComp*harmonicComp2;//real part of Psi
    
    //superposition
      float theta=atan(pos.y,pos.x);
      float cs=cos(float(m)*theta);
      float sn=sin(float(m)*theta);
 	
      float real =2.*psi*(cs*cos(iTime/6.));
   	  float imaginary=psi*(sn*sin(iTime/6.));
    
    real=psi*cos(iTime/6.);
        imaginary=psi2*sin(iTime/6.);
      
    //this is the magnitude of Psi*Psi
    float mag=psi*psi;
   
    float globalPhase=15.*iTime/(float(n*n));
    float localPhase= atan((sn*sin(iTime/6.)),(cs*cos(iTime/6.)));
    float phase =localPhase+globalPhase;
   
   
    

    
    return  vec4(mag,phase,real,imaginary);
}



//getting the associated probability density, and phase information

vec2 probDensity(ivec3 qNum, vec3 pos){
    
   float n=float(qNum.x);
   float viewRadius=80.;//constant to show true orbital sizes
   float densityMultiplier=0.001;//adjusts the brightness
    
    vec4 amp=amplitude(qNum, viewRadius*pos);
    float prob = amp.z*amp.z+amp.w*amp.w;
 
  return vec2(densityMultiplier*prob,amp.y);
}















vec4 Volume(ivec3 qNum,vec3 pos)
{
    //rotate starting position
    RotateY(pos,iTime/10.);
    RotateZ(pos,-0.25);
    
 
    //calculate the light intensity;
    vec2 amp=probDensity(qNum,pos);
    float prob=amp.x;
    float phase=amp.y;
    
    
    
    
    
    vec3 col1 = pal( PI/2.+phase, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
        //pal(phase, vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );
    vec3 col2 =pal(3.*PI/2.+ phase, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(2.0,1.0,0.0),vec3(0.5,0.20,0.25) );
        //red yellow palette
        //pal( phase+PI, vec3(0.8,0.5,0.4),vec3(0.2,0.4,0.2),vec3(2.0,1.0,1.0),vec3(0.0,0.25,0.25) );
    
    //mix two colors together: first is for lower intensity second is high intensity
    vec3 col = mix(col1,col2,smoothstep(2.5,3.,prob));
    //vec3(0.85,0.45,0.2)vec3(1.,1.,0.6)
    
    //slowly ramp up until 0.4 prob density, then between 0.4 and 0.9 draw densely
    prob = 0.2*smoothstep(0.,0.4,abs(prob))+0.8*smoothstep(0.4,0.9,abs(prob));
    //+1.*smoothstep(2.5,3.,abs(prob));
    
	return vec4(col, max(0.0,prob)*0.01);  
}




vec3 MarchVolume(ivec3 qNum,vec3 orig, vec3 dir)
{
    //Ray march to find the cube surface.
    float t = 0.0;
    vec3 pos = orig;
    float radius=1.5;
    float opacity=2.;
    
    for(int i = 0;i < MAX_MARCH_STEPS;i++)
    {
        pos = orig + dir * t;
        float dist = 100.0;
        
        
        //dist = min(dist, 8.0-length(pos));
        dist=min(dist,length(pos)-radius);
       // dist = min(dist, max(max(abs(pos.x),abs(pos.y)),abs(pos.z))-1.0);//length(pos)-1.0);
        
        t += dist;
        
        if(dist < MIN_MARCH_DIST){//you made it to the region!
            orig=pos;//reset the origin to your new point
           	t=0.;//reset the marching counter
            break;}
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
        //if(length(pos)>radius-0.2)//uncomment to make the below only apply in the shell
        {
            vec4 vol = Volume(qNum,pos);
             //add distance fog!
            vol.rgb*=5.*exp(-2.*t/radius);
        	vol.rgb *= vol.w;
            col += vol;}
    }
    
    return col.rgb;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    //choose quantum numbers;
	ivec3 qNum=ivec3(7,6,3);
    
    vec2 res = iResolution.xy / iResolution.y;
	vec2 uv = fragCoord.xy / iResolution.y;
    
    vec3 dir = normalize(vec3(uv-res/2.0,1.0));
    vec3 orig = vec3(0,0,-3.);
      
    RotateX(dir,radians(iMouse.y));
    RotateX(orig,radians(iMouse.y));
    RotateY(dir,radians(-iMouse.x));
    RotateY(orig,radians(-iMouse.x));
    
    
    vec3 color = MarchVolume(qNum,orig,dir);
    
	fragColor = vec4(color, 1.0);
}