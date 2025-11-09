


//assign a complex number z to each pixel of the screen
//here x is between -scale/2 and scale/2 and y is whatever size is required
//to keep the x and y axis the same scale.
vec2 toZ(vec2 frag){
    //set (x,y) to live in the unit square (-0.5,0.5):
    //this way the center of the screen is at (0,0)
    vec2 z = (frag/iResolution.xy-vec2(0.5));
    //rescale this so that the axes are same scale:
    z = z * vec2(1,iResolution.y/iResolution.x);

    //set the size of the view-box:
    z *= 30.*(1.+0.75*sin(iTime));

    return z;
}

//complex multiplication
vec2 cmult (vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}

vec2 cCosh(vec2 z){
    float re = cosh(z.x)*cos(z.y);
    float im = sinh(z.x)*sin(z.y);
    return vec2(re,im);
}




//mandelbrot is usi
bool inMandelbrot(vec2 c){

    vec2 z = vec2(0,0);
    for(int i=0;i<100;i++){
        z=cmult(z,z)+c;
    }

    //return true if z is close to origin, false if z is far from origin.
    return length(z)<5.;

}



vec2 tauToC(vec2 tau){
    vec2 term1 = vec2(1,0)-cCosh(tau);
    vec2 term2 = cCosh(tau);

    return cmult(term1,term2);

}






//draw the result to the screen!!
void mainImage( out vec4 fragColor, in vec2 fragCoord ){


    //get our complex number
    vec2 tau = toZ(fragCoord);

    vec2 c = tauToC(tau);



    vec3 col;

    //if the point is in the julia set: color it black
    //if it is not, color it white
    if(inMandelbrot(c)){
        col=vec3(0,0,0);
    }
    else{
        col=vec3(1,1,1);
    }

    //set the final pixel color.
    fragColor = vec4(col,1.0);
}
