
//assign a complex number z to each pixel of the screen
//here x is between -3 and 3 and y is whatever size is required
//to keep the x and y axis the same scale.
vec2 toZ(vec2 frag){
    //set (x,y) to live in the unit square (-0.5,0.5):
    //this way the center of the screen is at (0,0)
    vec2 z = (frag/iResolution.xy-vec2(0.5));
    //rescale this so that the axes are same scale:
    z = z * vec2(1,iResolution.y/iResolution.x);

    //set the size of the view-box:
    z *= 6.;

    return z;
}

//complex multiplication
vec2 cmult (vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}

//parameterize the main cartioid around the mandlebrot set boundary
vec2 cartioid(float t){
    vec2 eit = vec2(cos(t),sin(t));
    vec2 z = (vec2(2,0)-eit)/4.;
    return cmult(eit,z);
}

//parameterize the set of points which are period 2 in the mandlebrot set
vec2 period2(float t){
    return vec2(-1,0)+0.25*vec2(cos(t),sin(t));
}


//for a given value of c, determines whether or not the point z
//is in the julia set for z:
//it does this by seeing whether iteratio of z->z^2+c diverges to infinity or not
//change the bound on the for-loop to compute more or less accurately!
bool inJulia( vec2 z, vec2 c ){
    for(int i=0;i<100;i++){
        z=cmult(z,z)+c;
    }

    //return true if z is close to origin, false if z is far from origin.
    return length(z)<5.;
}



//draw the result to the screen!!
void mainImage( out vec4 fragColor, in vec2 fragCoord ){

    //get our complex number
    vec2 z = toZ(fragCoord);

    //choose a complex number c to draw the julia set of:
    vec2 c = cartioid(iTime/3.);

    vec3 col;

    //if the point is in the julia set: color it black
    //if it is not, color it white
    if(inJulia(z,c)){
        col=vec3(0,0,0);
    }
    else{
        col=vec3(1,1,1);
    }

    //set the final pixel color.
    fragColor = vec4(col,1.0);
}
