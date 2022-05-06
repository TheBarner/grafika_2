#version 330 core

const float PI = 3.141592654;
uniform float frame;
out vec4 fragColor;
in vec2 texCoord;

struct Sphere{
    vec3 center;
    float radius;
};

struct Cylinder{
    vec3 base;
    float radius;
    float height;
};

struct Ray{
    vec3 origin, direction;
};

vec4 quat(vec3 axis, float angle){
    return vec4(axis * sin(angle/2), cos(angle/2));
}

vec4 quatInv(vec4 quat){
    return vec4(-quat.xyz, quat.w);
}

vec4 quatMul(vec4 quat1, vec4 quat2){
    return vec4(quat1.w * quat2.xyz + quat2.w * quat1.xyz + cross(quat1.xyz, quat2.xyz), quat1.w * quat2.w - dot(quat1.xyz, quat2.xyz));
}

vec3 quatRot(vec3 point, vec4 quat){
    return quatMul(quatMul(quat, vec4(point, 0)), quatInv(quat)).xyz;
}

float sphereIntersection(const Ray ray, const Sphere sphere, out vec3 normal){
    vec3 toCenter = ray.origin - sphere.center;
    float sphereRSquared = sphere.radius * sphere.radius;
    float a = dot(ray.direction, ray.direction);
    float b = 2 * dot((toCenter), ray.direction);
    float c = dot(toCenter, toCenter) - sphereRSquared;

    float discriminant = b * b - 4 * a * c;
    if(discriminant < 0.0) {
        return -1;
    }

    float t = (-b - sqrt(discriminant))  / (2 * a);
    normal = normalize(ray.origin + ray.direction * t - sphere.center);
    return t;
}

float checkCylinderT(Ray ray, Cylinder cylinder, float t){
    if((ray.origin + ray.direction * t).y > cylinder.height + cylinder.base.y || (ray.origin + ray.direction * t).y < cylinder.base.y || t < 0.0){
        return -1;
    }
    return t;
}

float tCompare(float t1, float t2){
    if(t1 < 0.0 && t2 < 0.0) return -1;
    if(t2 < 0.0) return t1;
    if(t1 < 0.0) return t2;
    if(t1 < t2) return t1;
    if(t2 < t1) return t2;
}

float paraboloidIntersection(Ray ray, vec3 focus, out vec3 normal, float height, float size, float width, float offset){
    ray.origin = ray.origin + vec3(0, -offset, 0);
    float a = width * dot(ray.direction.xz, ray.direction.xz);
    float b = 2 * width * (dot(ray.origin.x, ray.direction.x) + dot(ray.origin.z, ray.direction.z)) - ray.direction.y;
    float c = width * dot(ray.origin.xz, ray.origin.xz) - ray.origin.y - size * size;
    float discriminant = b * b - 4 * a * c;
    if(discriminant < 0.0){
        return -1.0;
    }
    float t1 = (-b - sqrt(discriminant)) / (2 * a);
    float t2 = (-b + sqrt(discriminant)) / (2 * a);


    if((ray.origin + ray.direction * t1).y > focus.y + height) t1 = -1;
    if((ray.origin + ray.direction * t2).y > focus.y + height) t2 = -1;

    float t = tCompare(t1, t2);

    normal = ray.origin + ray.direction * t - focus;
    normal = normalize(normal);
    return t;
}

float planeIntersection(Ray ray, float y, out vec3 normal){

    float t = dot((vec3(0, y, 0) - ray.origin), vec3(0, 1, 0)) / dot(ray.direction, vec3(0, 1, 0));
    normal = normalize(ray.origin + ray.direction * t);
    return t;
}

float cylinderIntersection(Ray ray, Cylinder cylinder, out vec3 normal){
    float a = dot(ray.direction.x, ray.direction.x) + dot(ray.direction.z, ray.direction.z);
    float b = 2 * (dot(ray.direction.x, ray.origin.x) + dot(ray.origin.z, ray.direction.z));
    float c = dot(ray.origin.x, ray.origin.x) + dot(ray.origin.z, ray.origin.z) - cylinder.radius * cylinder.radius;
    float discriminant = b * b - 4 * a * c;
    if(discriminant < 0.0){
        return -1.0;
    }
    float t1 = (-b - sqrt(discriminant)) / (2 * a);
    float t2 = (-b + sqrt(discriminant)) / (2 * a);

    t1 = checkCylinderT(ray, cylinder, t1);
    t2 = checkCylinderT(ray, cylinder, t2);

    float t = tCompare(t1, t2);



    normal = ray.origin + ray.direction * t - cylinder.base;
    normal.y = 0.0;
    normal = normalize(normal);
    return t;
}

float cylTopIntersection(Ray ray,Cylinder cylinder, out vec3 normal){
    float t = dot((vec3(0, cylinder.base.y + cylinder.height, 0) - ray.origin), vec3(0, 1, 0)) / dot(ray.direction, vec3(0, 1, 0));
    if(length((ray.origin + ray.direction * t) - (cylinder.base + vec3(0, cylinder.height, 0))) > cylinder.radius){
        return -1;
    }
    normal = normalize(ray.origin + ray.direction * t);
    return t;
}

float allIntersections(Ray originalRay, Cylinder cylinder1, Cylinder cylinder2, Cylinder cylinder3, Sphere sphere1, Sphere sphere2, Sphere sphere3, out vec3 normal, float time){
    Ray ray;

    vec4 q = quat(normalize(vec3(0.1, 1, 0)), time);

    ray.origin = quatRot(originalRay.origin, q);
    ray.direction = quatRot(originalRay.direction, q);


    vec3 n1;
    vec3 n2;
    vec3 n3;
    vec3 n4;
    vec3 n5;
    vec3 n6;
    vec3 n7;
    vec3 n8;
    vec3 n9;


    float t1 = cylinderIntersection(ray, cylinder1, n1);
    float t9 = cylTopIntersection(ray, cylinder1, n9);
    float t8 = planeIntersection(ray, -1, n8);

    n1 = quatRot(n1, quatInv(q));
    n9 = quatRot(n9, quatInv(q));
    n8 = quatRot(n8, quatInv(q));



    q = quat(normalize(vec3(0, 1, 0.2)), time);

    ray.origin = quatRot(ray.origin, q);
    ray.direction = quatRot(ray.direction, q);

    float t2 = sphereIntersection(ray, sphere1, n2);
    float t3 = cylinderIntersection(ray, cylinder2, n3);

    n2 = quatRot(n2, quatInv(q));
    n3 = quatRot(n3, quatInv(q));


    q = quat(normalize(vec3(0, 1, 1.5)), time * 2);

    ray.origin -= vec3(0, 15, 0);
    ray.origin = quatRot(ray.origin, q);
    ray.direction = quatRot(ray.direction, q);


    float t4 = sphereIntersection(ray, sphere2, n4);
    float t5 = cylinderIntersection(ray, cylinder3, n5);
    n4 = quatRot(n4, quatInv(q));
    n5 = quatRot(n5, quatInv(q));

    q = quat(normalize(vec3(0, 1, -0.4)), time * 2);

    ray.origin -= vec3(0, 15, 0);
    ray.origin = quatRot(ray.origin, q);
    ray.direction = quatRot(ray.direction, q);

    float t6 = sphereIntersection(ray, sphere3, n6);
    float t7 = paraboloidIntersection(ray, vec3(0, 7, 0), n7, 0.1, 0, 0.1, 0);


    n6 = quatRot(n6, quatInv(q));
    n7 = quatRot(n7, quatInv(q));


    float t = tCompare(t1, t2);
    t = tCompare(t, t3);
    t = tCompare(t, t4);
    t = tCompare(t, t5);
    t = tCompare(t, t6);
    t = tCompare(t, t7);
    t = tCompare(t, t8);
    t = tCompare(t, t9);


    if(t == t1) normal = n1;
    if(t == t2) normal = n2;
    if(t == t3) normal = n3;
    if(t == t4) normal = n4;
    if(t == t5) normal = n5;
    if(t == t6) normal = n6;
    if(t == t7) normal = n7;
    if(t == t8) normal = n8;
    if(t == t9) normal = n9;

    return t;
}


void main(){
    float fov = PI /2 ;

    float time = frame / 60.0 / 2;



    Ray originalRay;
    originalRay.origin = vec3(0, 30, 50);
    originalRay.direction = normalize(vec3(texCoord *2 - 1, -tan(fov / 2.0)));

    Cylinder cylinder1;
    cylinder1.radius = 7;
    cylinder1.base = vec3(0, -1, 0);
    cylinder1.height = 1;

    Sphere sphere1;
    sphere1.radius = 1.2;
    sphere1.center = vec3(0);


    Cylinder cylinder2;
    cylinder2.radius = 0.5;
    cylinder2.base = vec3(0, 0, 0);
    cylinder2.height = 15;

    Sphere sphere2;
    sphere2.radius = 1.2;
    sphere2.center = vec3(0);

    Cylinder cylinder3;
    cylinder3.radius = 0.5;
    cylinder3.base = sphere2.center;
    cylinder3.height = 15;

    Sphere sphere3;
    sphere3.radius = 1.2;
    sphere3.center = vec3(0);

    vec3 normal;

    float t = allIntersections(originalRay, cylinder1, cylinder2, cylinder3, sphere1, sphere2, sphere3, normal, time);

    if (dot(normal, originalRay.direction) > 0.0) {
        normal *= -1;
    }


    vec3 lightPos = vec3(-50, 100, 100);


    vec3 hitPos = originalRay.origin + originalRay.direction * t;
    float lightDist = length(lightPos - hitPos);
    vec3 toLight = normalize(lightPos - hitPos);
    float lightT;
    float lightIntensity = 32000;
    float cosTheta = max(dot(toLight, normal), 0);
    if(t > 0){
        Ray lightRay;
        lightRay.origin = hitPos + normal * 0.1;
        lightRay.direction = toLight;
        vec3 _;
        lightT = allIntersections(lightRay, cylinder1, cylinder2, cylinder3, sphere1, sphere2, sphere3, _, time);
        if(lightT > 0){
            lightIntensity = 0;
        }
    }


    if(t > 0.0){
        fragColor = vec4(normal * cosTheta / pow(lightDist, 2.0) * lightIntensity, 1);
    }
    else{
        fragColor = vec4(vec3(0), 1);
    }

}