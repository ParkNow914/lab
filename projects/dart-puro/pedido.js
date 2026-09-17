(function dartProgram(){function copyProperties(a,b){var t=Object.keys(a)
for(var s=0;s<t.length;s++){var r=t[s]
b[r]=a[r]}}function mixinPropertiesHard(a,b){var t=Object.keys(a)
for(var s=0;s<t.length;s++){var r=t[s]
if(!b.hasOwnProperty(r)){b[r]=a[r]}}}function mixinPropertiesEasy(a,b){Object.assign(b,a)}var z=function(){var t=function(){}
t.prototype={p:{}}
var s=new t()
if(!(Object.getPrototypeOf(s)&&Object.getPrototypeOf(s).p===t.prototype.p))return false
try{if(typeof navigator!="undefined"&&typeof navigator.userAgent=="string"&&navigator.userAgent.indexOf("Chrome/")>=0)return true
if(typeof version=="function"&&version.length==0){var r=version()
if(/^\d+\.\d+\.\d+\.\d+$/.test(r))return true}}catch(q){}return false}()
function inherit(a,b){a.prototype.constructor=a
a.prototype["$i"+a.name]=a
if(b!=null){if(z){Object.setPrototypeOf(a.prototype,b.prototype)
return}var t=Object.create(b.prototype)
copyProperties(a.prototype,t)
a.prototype=t}}function inheritMany(a,b){for(var t=0;t<b.length;t++){inherit(b[t],a)}}function mixinEasy(a,b){mixinPropertiesEasy(b.prototype,a.prototype)
a.prototype.constructor=a}function mixinHard(a,b){mixinPropertiesHard(b.prototype,a.prototype)
a.prototype.constructor=a}function lazy(a,b,c,d){var t=a
a[b]=t
a[c]=function(){if(a[b]===t){a[b]=d()}a[c]=function(){return this[b]}
return a[b]}}function lazyFinal(a,b,c,d){var t=a
a[b]=t
a[c]=function(){if(a[b]===t){var s=d()
if(a[b]!==t){A.dX(b)}a[b]=s}var r=a[b]
a[c]=function(){return r}
return r}}function makeConstList(a,b){if(b!=null)A.r(a,b)
a.$flags=7
return a}function convertToFastObject(a){function t(){}t.prototype=a
new t()
return a}function convertAllToFastObject(a){for(var t=0;t<a.length;++t){convertToFastObject(a[t])}}var y=0
function instanceTearOffGetter(a,b){var t=null
return a?function(c){if(t===null)t=A.bs(b)
return new t(c,this)}:function(){if(t===null)t=A.bs(b)
return new t(this,null)}}function staticTearOffGetter(a){var t=null
return function(){if(t===null)t=A.bs(a).prototype
return t}}var x=0
function tearOffParameters(a,b,c,d,e,f,g,h,i,j){if(typeof h=="number"){h+=x}return{co:a,iS:b,iI:c,rC:d,dV:e,cs:f,fs:g,fT:h,aI:i||0,nDA:j}}function installStaticTearOff(a,b,c,d,e,f,g,h){var t=tearOffParameters(a,true,false,c,d,e,f,g,h,false)
var s=staticTearOffGetter(t)
a[b]=s}function installInstanceTearOff(a,b,c,d,e,f,g,h,i,j){c=!!c
var t=tearOffParameters(a,false,c,d,e,f,g,h,i,!!j)
var s=instanceTearOffGetter(c,t)
a[b]=s}function setOrUpdateInterceptorsByTag(a){var t=v.interceptorsByTag
if(!t){v.interceptorsByTag=a
return}copyProperties(a,t)}function setOrUpdateLeafTags(a){var t=v.leafTags
if(!t){v.leafTags=a
return}copyProperties(a,t)}function updateTypes(a){var t=v.types
var s=t.length
t.push.apply(t,a)
return s}function updateHolder(a,b){copyProperties(b,a)
return a}var hunkHelpers=function(){var t=function(a,b,c,d,e){return function(f,g,h,i){return installInstanceTearOff(f,g,a,b,c,d,[h],i,e,false)}},s=function(a,b,c,d){return function(e,f,g,h){return installStaticTearOff(e,f,a,b,c,[g],h,d)}}
return{inherit:inherit,inheritMany:inheritMany,mixin:mixinEasy,mixinHard:mixinHard,installStaticTearOff:installStaticTearOff,installInstanceTearOff:installInstanceTearOff,_instance_0u:t(0,0,null,["$0"],0),_instance_1u:t(0,1,null,["$1"],0),_instance_2u:t(0,2,null,["$2"],0),_instance_0i:t(1,0,null,["$0"],0),_instance_1i:t(1,1,null,["$1"],0),_instance_2i:t(1,2,null,["$2"],0),_static_0:s(0,null,["$0"],0),_static_1:s(1,null,["$1"],0),_static_2:s(2,null,["$2"],0),makeConstList:makeConstList,lazy:lazy,lazyFinal:lazyFinal,updateHolder:updateHolder,convertToFastObject:convertToFastObject,updateTypes:updateTypes,setOrUpdateInterceptorsByTag:setOrUpdateInterceptorsByTag,setOrUpdateLeafTags:setOrUpdateLeafTags}}()
function initializeDeferredHunk(a){x=v.types.length
a(hunkHelpers,v,w,$)}var J={
cF(a,b){var t=A.r(a,b.i("f<0>"))
t.$flags=1
return t},
K(a){if(typeof a=="number"){if(Math.floor(a)==a)return J.a2.prototype
return J.aA.prototype}if(typeof a=="string")return J.Q.prototype
if(a==null)return J.a3.prototype
if(typeof a=="boolean")return J.az.prototype
if(Array.isArray(a))return J.f.prototype
if(typeof a=="function")return J.a5.prototype
if(typeof a=="object"){if(a instanceof A.a){return a}else{return J.R.prototype}}if(!(a instanceof A.a))return J.V.prototype
return a},
dP(a){if(typeof a=="string")return J.Q.prototype
if(a==null)return a
if(Array.isArray(a))return J.f.prototype
if(!(a instanceof A.a))return J.V.prototype
return a},
cs(a,b){if(a==null)return b==null
if(typeof a!="object")return b!=null&&a===b
return J.K(a).v(a,b)},
bg(a){return J.K(a).gl(a)},
bv(a){return J.dP(a).gn(a)},
ct(a){return J.K(a).gt(a)},
am(a){return J.K(a).h(a)},
aw:function aw(){},
az:function az(){},
a3:function a3(){},
R:function R(){},
y:function y(){},
b0:function b0(){},
V:function V(){},
a5:function a5(){},
f:function f(a){this.$ti=a},
ay:function ay(){},
aV:function aV(a){this.$ti=a},
u:function u(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
a4:function a4(){},
a2:function a2(){},
aA:function aA(){},
Q:function Q(){}},A={bi:function bi(){},
bt(a){var t,s
for(t=$.o.length,s=0;s<t;++s)if(a===$.o[s])return!0
return!1},
aD:function aD(a){this.a=a},
a8:function a8(a,b,c){this.a=a
this.b=b
this.$ti=c},
a9:function a9(a,b,c){var _=this
_.a=null
_.b=a
_.c=b
_.$ti=c},
W:function W(a,b,c){this.a=a
this.b=b
this.$ti=c},
H:function H(a,b,c){this.a=a
this.b=b
this.$ti=c},
cf(a){var t=A.ce(a)
if(t!=null)return t
return"minified:"+a},
h(a){var t
if(typeof a=="string")return a
if(typeof a=="number"){if(a!==0)return""+a}else if(!0===a)return"true"
else if(!1===a)return"false"
else if(a==null)return"null"
t=J.am(a)
return t},
aG(a){var t,s=$.bG
if(s==null)s=$.bG=Symbol("identityHashCode")
t=a[s]
if(t==null){t=Math.random()*0x3fffffff|0
a[s]=t}return t},
aH(a){var t,s,r,q
if(a instanceof A.a)return A.n(A.aS(a),null)
t=J.K(a)
if(t===B.A||t===B.B||u.o.b(a)){s=B.t(a)
if(s!=="Object"&&s!=="")return s
r=a.constructor
if(typeof r=="function"){q=r.name
if(typeof q=="string"&&q!=="Object"&&q!=="")return q}}return A.n(A.aS(a),null)},
cI(a){var t,s,r
if(a==null||typeof a=="number"||A.bq(a))return J.am(a)
if(typeof a=="string")return JSON.stringify(a)
if(a instanceof A.x)return a.h(0)
if(a instanceof A.aQ)return a.a0(!0)
t=$.cr()
for(s=0;s<1;++s){r=t[s].W(a)
if(r!=null)return r}return"Instance of '"+A.aH(a)+"'"},
j(a){var t
if(a<=65535)return String.fromCharCode(a)
if(a<=1114111){t=a-65536
return String.fromCharCode((B.p.L(t,10)|55296)>>>0,t&1023|56320)}throw A.d(A.aI(a,0,1114111,null,null))},
l(a,b){if(a==null)J.bv(a)
throw A.d(A.c6(a,b))},
c6(a,b){var t,s="index"
if(!A.c1(b))return new A.B(!0,b,s,null)
t=J.bv(a)
if(b<0||b>=t)return A.cB(b,t,a,s)
return new A.ac(null,null,!0,b,s,"Value not in range")},
d(a){return A.k(a,new Error())},
k(a,b){var t
if(a==null)a=new A.af()
b.dartException=a
t=A.dY
if("defineProperty" in Object){Object.defineProperty(b,"message",{get:t})
b.name=""}else b.toString=t
return b},
dY(){return J.am(this.dartException)},
aT(a,b){throw A.k(a,b==null?new Error():b)},
cc(a,b,c){var t
if(b==null)b=0
if(c==null)c=0
t=Error()
A.aT(A.dh(a,b,c),t)},
dh(a,b,c){var t,s,r,q,p,o,n,m,l
if(typeof b=="string")t=b
else{s="[]=;add;removeWhere;retainWhere;removeRange;setRange;setInt8;setInt16;setInt32;setUint8;setUint16;setUint32;setFloat32;setFloat64".split(";")
r=s.length
q=b
if(q>r){c=q/r|0
q%=r}t=s[q]}p=typeof c=="string"?c:"modify;remove from;add to".split(";")[c]
o=u.j.b(a)?"list":"ByteData"
n=a.$flags|0
m="a "
if((n&4)!==0)l="constant "
else if((n&2)!==0){l="unmodifiable "
m="an "}else l=(n&1)!==0?"fixed-length ":""
return new A.aN("'"+t+"': Cannot "+p+" "+m+l+o)},
cb(a){throw A.d(A.bB(a))},
w(a){var t,s,r,q,p,o
a=A.dW(a.replace(String({}),"$receiver$"))
t=a.match(/\\\$[a-zA-Z]+\\\$/g)
if(t==null)t=A.r([],u.s)
s=t.indexOf("\\$arguments\\$")
r=t.indexOf("\\$argumentsExpr\\$")
q=t.indexOf("\\$expr\\$")
p=t.indexOf("\\$method\\$")
o=t.indexOf("\\$receiver\\$")
return new A.b1(a.replace(new RegExp("\\\\\\$arguments\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$argumentsExpr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$expr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$method\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$receiver\\\\\\$","g"),"((?:x|[^x])*)"),s,r,q,p,o)},
b2(a){return function($expr$){var $argumentsExpr$="$arguments$"
try{$expr$.$method$($argumentsExpr$)}catch(t){return t.message}}(a)},
bJ(a){return function($expr$){try{$expr$.$method$}catch(t){return t.message}}(a)},
bj(a,b){var t=b==null,s=t?null:b.method
return new A.aB(a,s,t?null:b.receiver)},
dZ(a){if(a==null)return new A.b_(a)
if(typeof a!=="object")return a
if("dartException" in a)return A.M(a,a.dartException)
return A.dH(a)},
M(a,b){if(u.C.b(b))if(b.$thrownJsError==null)b.$thrownJsError=a
return b},
dH(a){var t,s,r,q,p,o,n,m,l,k,j,i,h
if(!("message" in a))return a
t=a.message
if("number" in a&&typeof a.number=="number"){s=a.number
r=s&65535
if((B.p.L(s,16)&8191)===10)switch(r){case 438:return A.M(a,A.bj(A.h(t)+" (Error "+r+")",null))
case 445:case 5007:A.h(t)
return A.M(a,new A.ab())}}if(a instanceof TypeError){q=$.ch()
p=$.ci()
o=$.cj()
n=$.ck()
m=$.cn()
l=$.co()
k=$.cm()
$.cl()
j=$.cq()
i=$.cp()
h=q.m(t)
if(h!=null)return A.M(a,A.bj(A.Y(t),h))
else{h=p.m(t)
if(h!=null){h.method="call"
return A.M(a,A.bj(A.Y(t),h))}else if(o.m(t)!=null||n.m(t)!=null||m.m(t)!=null||l.m(t)!=null||k.m(t)!=null||n.m(t)!=null||j.m(t)!=null||i.m(t)!=null){A.Y(t)
return A.M(a,new A.ab())}}return A.M(a,new A.aM(typeof t=="string"?t:""))}if(a instanceof RangeError){if(typeof t=="string"&&t.indexOf("call stack")!==-1)return new A.ae()
t=function(b){try{return String(b)}catch(g){}return null}(a)
return A.M(a,new A.B(!1,null,null,typeof t=="string"?t.replace(/^RangeError:\s*/,""):t))}if(typeof InternalError=="function"&&a instanceof InternalError)if(typeof t=="string"&&t==="too much recursion")return new A.ae()
return a},
dV(a){if(a==null)return J.bg(a)
if(typeof a=="object")return A.aG(a)
return J.bg(a)},
dO(a,b){var t,s,r,q,p,o,n,m,l,k,j,i,h,g=a.length
for(t=b.$ti,s=t.c,t=t.y[1],r=0;r<g;){q=r+1
p=a[r]
r=q+1
o=a[q]
s.a(p)
t.a(o)
if(typeof p=="string"){n=b.b
if(n==null){m=Object.create(null)
m["<non-identifier-key>"]=m
delete m["<non-identifier-key>"]
b.b=m
n=m}l=n[p]
if(l==null)n[p]=b.B(p,o)
else l.b=o}else if(typeof p=="number"&&(p&0x3fffffff)===p){k=b.c
if(k==null){m=Object.create(null)
m["<non-identifier-key>"]=m
delete m["<non-identifier-key>"]
b.c=m
k=m}l=k[p]
if(l==null)k[p]=b.B(p,o)
else l.b=o}else{j=b.d
if(j==null){m=Object.create(null)
m["<non-identifier-key>"]=m
delete m["<non-identifier-key>"]
b.d=m
j=m}i=J.bg(p)&1073741823
h=j[i]
if(h==null)j[i]=[b.B(p,o)]
else{q=b.U(h,p)
if(q>=0)h[q].b=o
else h.push(b.B(p,o))}}}return b},
cA(a1){var t,s,r,q,p,o,n,m,l,k,j=a1.co,i=a1.iS,h=a1.iI,g=a1.nDA,f=a1.aI,e=a1.fs,d=a1.cs,c=e[0],b=d[0],a=j[c],a0=a1.fT
a0.toString
t=i?Object.create(new A.aK().constructor.prototype):Object.create(new A.N(null,null).constructor.prototype)
t.$initialize=t.constructor
s=i?function static_tear_off(){this.$initialize()}:function tear_off(a2,a3){this.$initialize(a2,a3)}
t.constructor=s
s.prototype=t
t.$_name=c
t.$_target=a
r=!i
if(r)q=A.bA(c,a,h,g)
else{t.$static_name=c
q=a}t.$S=A.cw(a0,i,h)
t[b]=q
for(p=q,o=1;o<e.length;++o){n=e[o]
if(typeof n=="string"){m=j[n]
l=n
n=m}else l=""
k=d[o]
if(k!=null){if(r)n=A.bA(l,n,h,g)
t[k]=n}if(o===f)p=n}t.$C=p
t.$R=a1.rC
t.$D=a1.dV
return s},
cw(a,b,c){if(typeof a=="number")return a
if(typeof a=="string"){if(b)throw A.d("Cannot compute signature for static tearoff.")
return function(d,e){return function(){return e(this,d)}}(a,A.cu)}throw A.d("Error in functionType of tearoff")},
cx(a,b,c,d){var t=A.bz
switch(b?-1:a){case 0:return function(e,f){return function(){return f(this)[e]()}}(c,t)
case 1:return function(e,f){return function(g){return f(this)[e](g)}}(c,t)
case 2:return function(e,f){return function(g,h){return f(this)[e](g,h)}}(c,t)
case 3:return function(e,f){return function(g,h,i){return f(this)[e](g,h,i)}}(c,t)
case 4:return function(e,f){return function(g,h,i,j){return f(this)[e](g,h,i,j)}}(c,t)
case 5:return function(e,f){return function(g,h,i,j,k){return f(this)[e](g,h,i,j,k)}}(c,t)
default:return function(e,f){return function(){return e.apply(f(this),arguments)}}(d,t)}},
bA(a,b,c,d){if(c)return A.cz(a,b,d)
return A.cx(b.length,d,a,b)},
cy(a,b,c,d){var t=A.bz,s=A.cv
switch(b?-1:a){case 0:throw A.d(new A.aJ("Intercepted function with no arguments."))
case 1:return function(e,f,g){return function(){return f(this)[e](g(this))}}(c,s,t)
case 2:return function(e,f,g){return function(h){return f(this)[e](g(this),h)}}(c,s,t)
case 3:return function(e,f,g){return function(h,i){return f(this)[e](g(this),h,i)}}(c,s,t)
case 4:return function(e,f,g){return function(h,i,j){return f(this)[e](g(this),h,i,j)}}(c,s,t)
case 5:return function(e,f,g){return function(h,i,j,k){return f(this)[e](g(this),h,i,j,k)}}(c,s,t)
case 6:return function(e,f,g){return function(h,i,j,k,l){return f(this)[e](g(this),h,i,j,k,l)}}(c,s,t)
default:return function(e,f,g){return function(){var r=[g(this)]
Array.prototype.push.apply(r,arguments)
return e.apply(f(this),r)}}(d,s,t)}},
cz(a,b,c){var t,s
if($.bx==null)$.bx=A.bw("interceptor")
if($.by==null)$.by=A.bw("receiver")
t=b.length
s=A.cy(t,c,a,b)
return s},
bs(a){return A.cA(a)},
cu(a,b){return A.ak(v.typeUniverse,A.aS(a.a),b)},
bz(a){return a.a},
cv(a){return a.b},
bw(a){var t,s,r,q=new A.N("receiver","interceptor"),p=Object.getOwnPropertyNames(q)
p.$flags=1
t=p
for(p=t.length,s=0;s<p;++s){r=t[s]
if(q[r]===a)return r}throw A.d(A.bh("Field name "+a+" not found."))},
ca(a){return v.getIsolateTag(a)},
dK(a,b){var t=b.length,s=v.rttc[""+t+";"+a]
if(s==null)return null
if(t===0)return s
if(t===s.length)return s.apply(null,b)
return s(b)},
dW(a){if(/[[\]{}()*+?.\\^$|]/.test(a))return a.replace(/[[\]{}()*+?.\\^$|]/g,"\\$&")
return a},
ad:function ad(){},
b1:function b1(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f},
ab:function ab(){},
aB:function aB(a,b,c){this.a=a
this.b=b
this.c=c},
aM:function aM(a){this.a=a},
b_:function b_(a){this.a=a},
x:function x(){},
ap:function ap(){},
aq:function aq(){},
aL:function aL(){},
aK:function aK(){},
N:function N(a,b){this.a=a
this.b=b},
aJ:function aJ(a){this.a=a},
S:function S(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
aY:function aY(a,b){this.a=a
this.b=b
this.c=null},
aQ:function aQ(){},
bk(a,b){var t=b.c
return t==null?b.c=A.ai(a,"bC",[b.x]):t},
bH(a){var t=a.w
if(t===6||t===7)return A.bH(a.x)
return t===11||t===12},
cK(a){return a.as},
aR(a){return A.bn(v.typeUniverse,a,!1)},
J(a0,a1,a2,a3){var t,s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a=a1.w
switch(a){case 5:case 1:case 2:case 3:case 4:return a1
case 6:t=a1.x
s=A.J(a0,t,a2,a3)
if(s===t)return a1
return A.bQ(a0,s,!0)
case 7:t=a1.x
s=A.J(a0,t,a2,a3)
if(s===t)return a1
return A.bP(a0,s,!0)
case 8:r=a1.y
q=A.Z(a0,r,a2,a3)
if(q===r)return a1
return A.ai(a0,a1.x,q)
case 9:p=a1.x
o=A.J(a0,p,a2,a3)
n=a1.y
m=A.Z(a0,n,a2,a3)
if(o===p&&m===n)return a1
return A.bl(a0,o,m)
case 10:l=a1.x
k=a1.y
j=A.Z(a0,k,a2,a3)
if(j===k)return a1
return A.bR(a0,l,j)
case 11:i=a1.x
h=A.J(a0,i,a2,a3)
g=a1.y
f=A.dE(a0,g,a2,a3)
if(h===i&&f===g)return a1
return A.bO(a0,h,f)
case 12:e=a1.y
a3+=e.length
d=A.Z(a0,e,a2,a3)
p=a1.x
o=A.J(a0,p,a2,a3)
if(d===e&&o===p)return a1
return A.bm(a0,o,d,!0)
case 13:c=a1.x
if(c<a3)return a1
b=a2[c-a3]
if(b==null)return a1
return b
default:throw A.d(A.ao("Attempted to substitute unexpected RTI kind "+a))}},
Z(a,b,c,d){var t,s,r,q,p=b.length,o=A.b8(p)
for(t=!1,s=0;s<p;++s){r=b[s]
q=A.J(a,r,c,d)
if(q!==r)t=!0
o[s]=q}return t?o:b},
dF(a,b,c,d){var t,s,r,q,p,o,n=b.length,m=A.b8(n)
for(t=!1,s=0;s<n;s+=3){r=b[s]
q=b[s+1]
p=b[s+2]
o=A.J(a,p,c,d)
if(o!==p)t=!0
m.splice(s,3,r,q,o)}return t?m:b},
dE(a,b,c,d){var t,s=b.a,r=A.Z(a,s,c,d),q=b.b,p=A.Z(a,q,c,d),o=b.c,n=A.dF(a,o,c,d)
if(r===s&&p===q&&n===o)return b
t=new A.aP()
t.a=r
t.b=p
t.c=n
return t},
r(a,b){a[v.arrayRti]=b
return a},
c5(a){var t=a.$S
if(t!=null){if(typeof t=="number")return A.dR(t)
return a.$S()}return null},
dS(a,b){var t
if(A.bH(b))if(a instanceof A.x){t=A.c5(a)
if(t!=null)return t}return A.aS(a)},
aS(a){if(a instanceof A.a)return A.bo(a)
if(Array.isArray(a))return A.X(a)
return A.bp(J.K(a))},
X(a){var t=a[v.arrayRti],s=u.b
if(t==null)return s
if(t.constructor!==s.constructor)return s
return t},
bo(a){var t=a.$ti
return t!=null?t:A.bp(a)},
bp(a){var t=a.constructor,s=t.$ccache
if(s!=null)return s
return A.dp(a,t)},
dp(a,b){var t=a instanceof A.x?Object.getPrototypeOf(Object.getPrototypeOf(a)).constructor:b,s=A.d2(v.typeUniverse,t.name)
b.$ccache=s
return s},
dR(a){var t,s=v.types,r=s[a]
if(typeof r=="string"){t=A.bn(v.typeUniverse,r,!1)
s[a]=t
return t}return r},
dQ(a){return A.a0(A.bo(a))},
br(a){var t
if(a instanceof A.aQ)return A.dM(a.$r,a.a_())
t=a instanceof A.x?A.c5(a):null
if(t!=null)return t
if(u.k.b(a))return J.ct(a).a
if(Array.isArray(a))return A.X(a)
return A.aS(a)},
a0(a){var t=a.r
return t==null?a.r=new A.b7(a):t},
dM(a,b){var t,s,r=b,q=r.length
if(q===0)return u.F
if(0>=q)return A.l(r,0)
t=A.ak(v.typeUniverse,A.br(r[0]),"@<0>")
for(s=1;s<q;++s){if(!(s<r.length))return A.l(r,s)
t=A.bT(v.typeUniverse,t,A.br(r[s]))}return A.ak(v.typeUniverse,t,a)},
dn(a){var t=this
t.b=A.dD(t)
return t.b(a)},
dD(a){var t,s,r,q,p
if(a===u.K)return A.dv
if(A.L(a))return A.dz
t=a.w
if(t===6)return A.dl
if(t===1)return A.c3
if(t===7)return A.dq
s=A.dC(a)
if(s!=null)return s
if(t===8){r=a.x
if(a.y.every(A.L)){a.f="$i"+r
if(r==="T")return A.dt
if(a===u.m)return A.ds
return A.dy}}else if(t===10){q=A.dK(a.x,a.y)
p=q==null?A.c3:q
return p==null?A.bX(p):p}return A.dj},
dC(a){if(a.w===8){if(a===u.S)return A.c1
if(a===u.i||a===u.H)return A.du
if(a===u.N)return A.dx
if(a===u.y)return A.bq}return null},
dm(a){var t=this,s=A.di
if(A.L(t))s=A.dd
else if(t===u.K)s=A.bX
else if(A.a1(t)){s=A.dk
if(t===u.w)s=A.d8
else if(t===u.v)s=A.dc
else if(t===u.d)s=A.d5
else if(t===u.n)s=A.bW
else if(t===u.I)s=A.d7
else if(t===u.A)s=A.da}else if(t===u.S)s=A.b9
else if(t===u.N)s=A.Y
else if(t===u.y)s=A.d4
else if(t===u.H)s=A.db
else if(t===u.i)s=A.d6
else if(t===u.m)s=A.d9
t.a=s
return t.a(a)},
dj(a){var t=this
if(a==null)return A.a1(t)
return A.dT(v.typeUniverse,A.dS(a,t),t)},
dl(a){if(a==null)return!0
return this.x.b(a)},
dy(a){var t,s=this
if(a==null)return A.a1(s)
t=s.f
if(a instanceof A.a)return!!a[t]
return!!J.K(a)[t]},
dt(a){var t,s=this
if(a==null)return A.a1(s)
if(typeof a!="object")return!1
if(Array.isArray(a))return!0
t=s.f
if(a instanceof A.a)return!!a[t]
return!!J.K(a)[t]},
ds(a){var t=this
if(a==null)return!1
if(typeof a=="object"){if(a instanceof A.a)return!!a[t.f]
return!0}if(typeof a=="function")return!0
return!1},
c2(a){if(typeof a=="object"){if(a instanceof A.a)return u.m.b(a)
return!0}if(typeof a=="function")return!0
return!1},
di(a){var t=this
if(a==null){if(A.a1(t))return a}else if(t.b(a))return a
throw A.k(A.bZ(a,t),new Error())},
dk(a){var t=this
if(a==null||t.b(a))return a
throw A.k(A.bZ(a,t),new Error())},
bZ(a,b){return new A.ag("TypeError: "+A.bK(a,A.n(b,null)))},
bK(a,b){return A.au(a)+": type '"+A.n(A.br(a),null)+"' is not a subtype of type '"+b+"'"},
p(a,b){return new A.ag("TypeError: "+A.bK(a,b))},
dq(a){var t=this
return t.x.b(a)||A.bk(v.typeUniverse,t).b(a)},
dv(a){return a!=null},
bX(a){if(a!=null)return a
throw A.k(A.p(a,"Object"),new Error())},
dz(a){return!0},
dd(a){return a},
c3(a){return!1},
bq(a){return!0===a||!1===a},
d4(a){if(!0===a)return!0
if(!1===a)return!1
throw A.k(A.p(a,"bool"),new Error())},
d5(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.k(A.p(a,"bool?"),new Error())},
d6(a){if(typeof a=="number")return a
throw A.k(A.p(a,"double"),new Error())},
d7(a){if(typeof a=="number")return a
if(a==null)return a
throw A.k(A.p(a,"double?"),new Error())},
c1(a){return typeof a=="number"&&Math.floor(a)===a},
b9(a){if(typeof a=="number"&&Math.floor(a)===a)return a
throw A.k(A.p(a,"int"),new Error())},
d8(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.k(A.p(a,"int?"),new Error())},
du(a){return typeof a=="number"},
db(a){if(typeof a=="number")return a
throw A.k(A.p(a,"num"),new Error())},
bW(a){if(typeof a=="number")return a
if(a==null)return a
throw A.k(A.p(a,"num?"),new Error())},
dx(a){return typeof a=="string"},
Y(a){if(typeof a=="string")return a
throw A.k(A.p(a,"String"),new Error())},
dc(a){if(typeof a=="string")return a
if(a==null)return a
throw A.k(A.p(a,"String?"),new Error())},
d9(a){if(A.c2(a))return a
throw A.k(A.p(a,"JSObject"),new Error())},
da(a){if(a==null)return a
if(A.c2(a))return a
throw A.k(A.p(a,"JSObject?"),new Error())},
c4(a,b){var t,s,r
for(t="",s="",r=0;r<a.length;++r,s=", ")t+=s+A.n(a[r],b)
return t},
dB(a,b){var t,s,r,q,p,o,n=a.x,m=a.y
if(""===n)return"("+A.c4(m,b)+")"
t=m.length
s=n.split(",")
r=s.length-t
for(q="(",p="",o=0;o<t;++o,p=", "){q+=p
if(r===0)q+="{"
q+=A.n(m[o],b)
if(r>=0)q+=" "+s[r];++r}return q+"})"},
c_(a2,a3,a4){var t,s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=", ",a1=null
if(a4!=null){t=a4.length
if(a3==null)a3=A.r([],u.s)
else a1=a3.length
s=a3.length
for(r=t;r>0;--r)B.a.k(a3,"T"+(s+r))
for(q=u.X,p="<",o="",r=0;r<t;++r,o=a0){n=a3.length
m=n-1-r
if(!(m>=0))return A.l(a3,m)
p=p+o+a3[m]
l=a4[r]
k=l.w
if(!(k===2||k===3||k===4||k===5||l===q))p+=" extends "+A.n(l,a3)}p+=">"}else p=""
q=a2.x
j=a2.y
i=j.a
h=i.length
g=j.b
f=g.length
e=j.c
d=e.length
c=A.n(q,a3)
for(b="",a="",r=0;r<h;++r,a=a0)b+=a+A.n(i[r],a3)
if(f>0){b+=a+"["
for(a="",r=0;r<f;++r,a=a0)b+=a+A.n(g[r],a3)
b+="]"}if(d>0){b+=a+"{"
for(a="",r=0;r<d;r+=3,a=a0){b+=a
if(e[r+1])b+="required "
b+=A.n(e[r+2],a3)+" "+e[r]}b+="}"}if(a1!=null){a3.toString
a3.length=a1}return p+"("+b+") => "+c},
n(a,b){var t,s,r,q,p,o,n,m=a.w
if(m===5)return"erased"
if(m===2)return"dynamic"
if(m===3)return"void"
if(m===1)return"Never"
if(m===4)return"any"
if(m===6){t=a.x
s=A.n(t,b)
r=t.w
return(r===11||r===12?"("+s+")":s)+"?"}if(m===7)return"FutureOr<"+A.n(a.x,b)+">"
if(m===8){q=A.dG(a.x)
p=a.y
return p.length>0?q+("<"+A.c4(p,b)+">"):q}if(m===10)return A.dB(a,b)
if(m===11)return A.c_(a,b,null)
if(m===12)return A.c_(a.x,b,a.y)
if(m===13){o=a.x
n=b.length
o=n-1-o
if(!(o>=0&&o<n))return A.l(b,o)
return b[o]}return"?"},
dG(a){var t=A.ce(a)
if(t!=null)return t
return"minified:"+a},
d3(a,b){var t=a.tR[b]
while(typeof t=="string")t=a.tR[t]
return t},
d2(a,b){var t,s,r,q,p,o=a.eT,n=o[b]
if(n==null)return A.bn(a,b,!1)
else if(typeof n=="number"){t=n
s=A.aj(a,5,"#")
r=A.b8(t)
for(q=0;q<t;++q)r[q]=s
p=A.ai(a,b,r)
o[b]=p
return p}else return n},
d1(a,b){return A.bU(a.tR,b)},
d0(a,b){return A.bU(a.eT,b)},
bn(a,b,c){var t,s=a.eC,r=s.get(b)
if(r!=null)return r
t=A.bS(a,null,b,!1)
s.set(b,t)
return t},
ak(a,b,c){var t,s,r=b.z
if(r==null)r=b.z=new Map()
t=r.get(c)
if(t!=null)return t
s=A.bS(a,b,c,!0)
r.set(c,s)
return s},
bT(a,b,c){var t,s,r,q=b.Q
if(q==null)q=b.Q=new Map()
t=c.as
s=q.get(t)
if(s!=null)return s
r=A.bl(a,b,c.w===9?c.y:[c])
q.set(t,r)
return r},
bS(a,b,c,d){return A.cU(A.cO(a,b,c,d))},
z(a,b){b.a=A.dm
b.b=A.dn
return b},
aj(a,b,c){var t,s,r=a.eC.get(c)
if(r!=null)return r
t=new A.q(null,null)
t.w=b
t.as=c
s=A.z(a,t)
a.eC.set(c,s)
return s},
bQ(a,b,c){var t,s=b.as+"?",r=a.eC.get(s)
if(r!=null)return r
t=A.cZ(a,b,s,c)
a.eC.set(s,t)
return t},
cZ(a,b,c,d){var t,s,r
if(d){t=b.w
s=!0
if(!A.L(b))if(!(b===u.P||b===u.T))if(t!==6)s=t===7&&A.a1(b.x)
if(s)return b
else if(t===1)return u.P}r=new A.q(null,null)
r.w=6
r.x=b
r.as=c
return A.z(a,r)},
bP(a,b,c){var t,s=b.as+"/",r=a.eC.get(s)
if(r!=null)return r
t=A.cX(a,b,s,c)
a.eC.set(s,t)
return t},
cX(a,b,c,d){var t,s
if(d){t=b.w
if(A.L(b)||b===u.K)return b
else if(t===1)return A.ai(a,"bC",[b])
else if(b===u.P||b===u.T)return u.O}s=new A.q(null,null)
s.w=7
s.x=b
s.as=c
return A.z(a,s)},
d_(a,b){var t,s,r=""+b+"^",q=a.eC.get(r)
if(q!=null)return q
t=new A.q(null,null)
t.w=13
t.x=b
t.as=r
s=A.z(a,t)
a.eC.set(r,s)
return s},
ah(a){var t,s,r,q=a.length
for(t="",s="",r=0;r<q;++r,s=",")t+=s+a[r].as
return t},
cW(a){var t,s,r,q,p,o=a.length
for(t="",s="",r=0;r<o;r+=3,s=","){q=a[r]
p=a[r+1]?"!":":"
t+=s+q+p+a[r+2].as}return t},
ai(a,b,c){var t,s,r,q=b
if(c.length>0)q+="<"+A.ah(c)+">"
t=a.eC.get(q)
if(t!=null)return t
s=new A.q(null,null)
s.w=8
s.x=b
s.y=c
if(c.length>0)s.c=c[0]
s.as=q
r=A.z(a,s)
a.eC.set(q,r)
return r},
bl(a,b,c){var t,s,r,q,p,o
if(b.w===9){t=b.x
s=b.y.concat(c)}else{s=c
t=b}r=t.as+(";<"+A.ah(s)+">")
q=a.eC.get(r)
if(q!=null)return q
p=new A.q(null,null)
p.w=9
p.x=t
p.y=s
p.as=r
o=A.z(a,p)
a.eC.set(r,o)
return o},
bR(a,b,c){var t,s,r="+"+(b+"("+A.ah(c)+")"),q=a.eC.get(r)
if(q!=null)return q
t=new A.q(null,null)
t.w=10
t.x=b
t.y=c
t.as=r
s=A.z(a,t)
a.eC.set(r,s)
return s},
bO(a,b,c){var t,s,r,q,p,o=b.as,n=c.a,m=n.length,l=c.b,k=l.length,j=c.c,i=j.length,h="("+A.ah(n)
if(k>0){t=m>0?",":""
h+=t+"["+A.ah(l)+"]"}if(i>0){t=m>0?",":""
h+=t+"{"+A.cW(j)+"}"}s=o+(h+")")
r=a.eC.get(s)
if(r!=null)return r
q=new A.q(null,null)
q.w=11
q.x=b
q.y=c
q.as=s
p=A.z(a,q)
a.eC.set(s,p)
return p},
bm(a,b,c,d){var t,s=b.as+("<"+A.ah(c)+">"),r=a.eC.get(s)
if(r!=null)return r
t=A.cY(a,b,c,s,d)
a.eC.set(s,t)
return t},
cY(a,b,c,d,e){var t,s,r,q,p,o,n,m
if(e){t=c.length
s=A.b8(t)
for(r=0,q=0;q<t;++q){p=c[q]
if(p.w===1){s[q]=p;++r}}if(r>0){o=A.J(a,b,s,0)
n=A.Z(a,c,s,0)
return A.bm(a,o,n,c!==n)}}m=new A.q(null,null)
m.w=12
m.x=b
m.y=c
m.as=d
return A.z(a,m)},
cO(a,b,c,d){return{u:a,e:b,r:c,s:[],p:0,n:d}},
cU(a){var t,s,r,q,p,o,n,m=a.r,l=a.s
for(t=m.length,s=0;s<t;){r=m.charCodeAt(s)
if(r>=48&&r<=57)s=A.cQ(s+1,r,m,l)
else if((((r|32)>>>0)-97&65535)<26||r===95||r===36||r===124)s=A.bM(a,s,m,l,!1)
else if(r===46)s=A.bM(a,s,m,l,!0)
else{++s
switch(r){case 44:break
case 58:l.push(!1)
break
case 33:l.push(!0)
break
case 59:l.push(A.I(a.u,a.e,l.pop()))
break
case 94:l.push(A.d_(a.u,l.pop()))
break
case 35:l.push(A.aj(a.u,5,"#"))
break
case 64:l.push(A.aj(a.u,2,"@"))
break
case 126:l.push(A.aj(a.u,3,"~"))
break
case 60:l.push(a.p)
a.p=l.length
break
case 62:A.cS(a,l)
break
case 38:A.cR(a,l)
break
case 63:q=a.u
l.push(A.bQ(q,A.I(q,a.e,l.pop()),a.n))
break
case 47:q=a.u
l.push(A.bP(q,A.I(q,a.e,l.pop()),a.n))
break
case 40:l.push(-3)
l.push(a.p)
a.p=l.length
break
case 41:A.cP(a,l)
break
case 91:l.push(a.p)
a.p=l.length
break
case 93:p=l.splice(a.p)
A.bN(a.u,a.e,p)
a.p=l.pop()
l.push(p)
l.push(-1)
break
case 123:l.push(a.p)
a.p=l.length
break
case 125:p=l.splice(a.p)
A.cV(a.u,a.e,p)
a.p=l.pop()
l.push(p)
l.push(-2)
break
case 43:o=m.indexOf("(",s)
l.push(m.substring(s,o))
l.push(-4)
l.push(a.p)
a.p=l.length
s=o+1
break
default:throw"Bad character "+r}}}n=l.pop()
return A.I(a.u,a.e,n)},
cQ(a,b,c,d){var t,s,r=b-48
for(t=c.length;a<t;++a){s=c.charCodeAt(a)
if(!(s>=48&&s<=57))break
r=r*10+(s-48)}d.push(r)
return a},
bM(a,b,c,d,e){var t,s,r,q,p,o,n=b+1
for(t=c.length;n<t;++n){s=c.charCodeAt(n)
if(s===46){if(e)break
e=!0}else{if(!((((s|32)>>>0)-97&65535)<26||s===95||s===36||s===124))r=s>=48&&s<=57
else r=!0
if(!r)break}}q=c.substring(b,n)
if(e){t=a.u
p=a.e
if(p.w===9)p=p.x
o=A.d3(t,p.x)[q]
if(o==null)A.aT('No "'+q+'" in "'+A.cK(p)+'"')
d.push(A.ak(t,p,o))}else d.push(q)
return n},
cS(a,b){var t,s=a.u,r=A.bL(a,b),q=b.pop()
if(typeof q=="string")b.push(A.ai(s,q,r))
else{t=A.I(s,a.e,q)
switch(t.w){case 11:b.push(A.bm(s,t,r,a.n))
break
default:b.push(A.bl(s,t,r))
break}}},
cP(a,b){var t,s,r,q=a.u,p=b.pop(),o=null,n=null
if(typeof p=="number")switch(p){case-1:o=b.pop()
break
case-2:n=b.pop()
break
default:b.push(p)
break}else b.push(p)
t=A.bL(a,b)
p=b.pop()
switch(p){case-3:p=b.pop()
if(o==null)o=q.sEA
if(n==null)n=q.sEA
s=A.I(q,a.e,p)
r=new A.aP()
r.a=t
r.b=o
r.c=n
b.push(A.bO(q,s,r))
return
case-4:b.push(A.bR(q,b.pop(),t))
return
default:throw A.d(A.ao("Unexpected state under `()`: "+A.h(p)))}},
cR(a,b){var t=b.pop()
if(0===t){b.push(A.aj(a.u,1,"0&"))
return}if(1===t){b.push(A.aj(a.u,4,"1&"))
return}throw A.d(A.ao("Unexpected extended operation "+A.h(t)))},
bL(a,b){var t=b.splice(a.p)
A.bN(a.u,a.e,t)
a.p=b.pop()
return t},
I(a,b,c){if(typeof c=="string")return A.ai(a,c,a.sEA)
else if(typeof c=="number"){b.toString
return A.cT(a,b,c)}else return c},
bN(a,b,c){var t,s=c.length
for(t=0;t<s;++t)c[t]=A.I(a,b,c[t])},
cV(a,b,c){var t,s=c.length
for(t=2;t<s;t+=3)c[t]=A.I(a,b,c[t])},
cT(a,b,c){var t,s,r=b.w
if(r===9){if(c===0)return b.x
t=b.y
s=t.length
if(c<=s)return t[c-1]
c-=s
b=b.x
r=b.w}else if(c===0)return b
if(r!==8)throw A.d(A.ao("Indexed base must be an interface type"))
t=b.y
if(c<=t.length)return t[c-1]
throw A.d(A.ao("Bad index "+c+" for "+b.h(0)))},
dT(a,b,c){var t,s=b.d
if(s==null)s=b.d=new Map()
t=s.get(c)
if(t==null){t=A.c(a,b,null,c,null)
s.set(c,t)}return t},
c(a,b,c,d,e){var t,s,r,q,p,o,n,m,l,k,j
if(b===d)return!0
if(A.L(d))return!0
t=b.w
if(t===4)return!0
if(A.L(b))return!1
if(b.w===1)return!0
s=t===13
if(s)if(A.c(a,c[b.x],c,d,e))return!0
r=d.w
q=u.P
if(b===q||b===u.T){if(r===7)return A.c(a,b,c,d.x,e)
return d===q||d===u.T||r===6}if(d===u.K){if(t===7)return A.c(a,b.x,c,d,e)
return t!==6}if(t===7){if(!A.c(a,b.x,c,d,e))return!1
return A.c(a,A.bk(a,b),c,d,e)}if(t===6)return A.c(a,q,c,d,e)&&A.c(a,b.x,c,d,e)
if(r===7){if(A.c(a,b,c,d.x,e))return!0
return A.c(a,b,c,A.bk(a,d),e)}if(r===6)return A.c(a,b,c,q,e)||A.c(a,b,c,d.x,e)
if(s)return!1
q=t!==11
if((!q||t===12)&&d===u.Z)return!0
p=t===10
if(p&&d===u.J)return!0
if(r===12){if(b===u.g)return!0
if(t!==12)return!1
o=b.y
n=d.y
m=o.length
if(m!==n.length)return!1
c=c==null?o:o.concat(c)
e=e==null?n:n.concat(e)
for(l=0;l<m;++l){k=o[l]
j=n[l]
if(!A.c(a,k,c,j,e)||!A.c(a,j,e,k,c))return!1}return A.c0(a,b.x,c,d.x,e)}if(r===11){if(b===u.g)return!0
if(q)return!1
return A.c0(a,b,c,d,e)}if(t===8){if(r!==8)return!1
return A.dr(a,b,c,d,e)}if(p&&r===10)return A.dw(a,b,c,d,e)
return!1},
c0(a2,a3,a4,a5,a6){var t,s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
if(!A.c(a2,a3.x,a4,a5.x,a6))return!1
t=a3.y
s=a5.y
r=t.a
q=s.a
p=r.length
o=q.length
if(p>o)return!1
n=o-p
m=t.b
l=s.b
k=m.length
j=l.length
if(p+k<o+j)return!1
for(i=0;i<p;++i){h=r[i]
if(!A.c(a2,q[i],a6,h,a4))return!1}for(i=0;i<n;++i){h=m[i]
if(!A.c(a2,q[p+i],a6,h,a4))return!1}for(i=0;i<j;++i){h=m[n+i]
if(!A.c(a2,l[i],a6,h,a4))return!1}g=t.c
f=s.c
e=g.length
d=f.length
for(c=0,b=0;b<d;b+=3){a=f[b]
for(;;){if(c>=e)return!1
a0=g[c]
c+=3
if(a<a0)return!1
a1=g[c-2]
if(a0<a){if(a1)return!1
continue}h=f[b+1]
if(a1&&!h)return!1
h=g[c-1]
if(!A.c(a2,f[b+2],a6,h,a4))return!1
break}}while(c<e){if(g[c+1])return!1
c+=3}return!0},
dr(a,b,c,d,e){var t,s,r,q,p,o=b.x,n=d.x
while(o!==n){t=a.tR[o]
if(t==null)return!1
if(typeof t=="string"){o=t
continue}s=t[n]
if(s==null)return!1
r=s.length
q=r>0?new Array(r):v.typeUniverse.sEA
for(p=0;p<r;++p)q[p]=A.ak(a,b,s[p])
return A.bV(a,q,null,c,d.y,e)}return A.bV(a,b.y,null,c,d.y,e)},
bV(a,b,c,d,e,f){var t,s=b.length
for(t=0;t<s;++t)if(!A.c(a,b[t],d,e[t],f))return!1
return!0},
dw(a,b,c,d,e){var t,s=b.y,r=d.y,q=s.length
if(q!==r.length)return!1
if(b.x!==d.x)return!1
for(t=0;t<q;++t)if(!A.c(a,s[t],c,r[t],e))return!1
return!0},
a1(a){var t=a.w,s=!0
if(!(a===u.P||a===u.T))if(!A.L(a))if(t!==6)s=t===7&&A.a1(a.x)
return s},
L(a){var t=a.w
return t===2||t===3||t===4||t===5||a===u.X},
bU(a,b){var t,s,r=Object.keys(b),q=r.length
for(t=0;t<q;++t){s=r[t]
a[s]=b[s]}},
b8(a){return a>0?new Array(a):v.typeUniverse.sEA},
q:function q(a,b){var _=this
_.a=a
_.b=b
_.r=_.f=_.d=_.c=null
_.w=0
_.as=_.Q=_.z=_.y=_.x=null},
aP:function aP(){this.c=this.b=this.a=null},
b7:function b7(a){this.a=a},
aO:function aO(){},
ag:function ag(a){this.a=a},
aE(a,b,c){return b.i("@<0>").J(c).i("bE<1,2>").a(A.dO(a,new A.S(b.i("@<0>").J(c).i("S<1,2>"))))},
cC(a,b){var t=a.a,s=A.X(t)
t=new J.u(t,t.length,s.i("u<1>"))
if(new A.H(t,a.b,a.$ti.i("H<1>")).j()){t=t.d
return t==null?s.c.a(t):t}return null},
bF(a){var t,s
if(A.bt(a))return"{...}"
t=new A.U("")
try{s={}
B.a.k($.o,a)
t.a+="{"
s.a=!0
a.M(0,new A.aZ(s,t))
t.a+="}"}finally{if(0>=$.o.length)return A.l($.o,-1)
$.o.pop()}s=t.a
return s.charCodeAt(0)==0?s:s},
a7:function a7(){},
aZ:function aZ(a,b){this.a=a
this.b=b},
bD(a,b,c){return new A.a6(a,b)},
dg(a){return a.a1()},
cM(a,b){return new A.b4(a,[],A.dI())},
cN(a,b,c){var t,s=new A.U(""),r=A.cM(s,b)
r.D(a)
t=s.a
return t.charCodeAt(0)==0?t:t},
ar:function ar(){},
at:function at(){},
a6:function a6(a,b){this.a=a
this.b=b},
aC:function aC(a,b){this.a=a
this.b=b},
aW:function aW(){},
aX:function aX(a){this.b=a},
b5:function b5(){},
b6:function b6(a,b){this.a=a
this.b=b},
b4:function b4(a,b,c){this.c=a
this.a=b
this.b=c},
cH(a,b,c){var t
if(a>4294967295)A.aT(A.aI(a,0,4294967295,"length",null))
t=J.cF(new Array(a),c)
return t},
e1(a,b,c){var t,s,r=A.r([],c.i("f<0>"))
for(t=a.length,s=0;s<a.length;a.length===t||(0,A.cb)(a),++s)B.a.k(r,c.a(a[s]))
r.$flags=1
return r},
cG(a,b){var t,s=A.r([],b.i("f<0>"))
for(t=a.gu(a);t.j();)B.a.k(s,t.gq())
return s},
bI(a,b,c){var t,s=A.X(b),r=new J.u(b,b.length,s.i("u<1>"))
if(!r.j())return a
if(c.length===0){s=s.c
do{t=r.d
a+=A.h(t==null?s.a(t):t)}while(r.j())}else{t=r.d
a+=A.h(t==null?s.c.a(t):t)
for(s=s.c;r.j();){t=r.d
a=a+c+A.h(t==null?s.a(t):t)}}return a},
au(a){if(typeof a=="number"||A.bq(a)||a==null)return J.am(a)
if(typeof a=="string")return JSON.stringify(a)
return A.cI(a)},
ao(a){return new A.an(a)},
bh(a){return new A.B(!1,null,null,a)},
aI(a,b,c,d,e){return new A.ac(b,c,!0,a,d,"Invalid value")},
cJ(a,b,c){if(0>a||a>c)throw A.d(A.aI(a,0,c,"start",null))
if(b!=null){if(a>b||b>c)throw A.d(A.aI(b,a,c,"end",null))
return b}return c},
cB(a,b,c,d){return new A.av(b,!0,a,d,"Index out of range")},
bB(a){return new A.as(a)},
cE(a,b,c){var t,s
if(A.bt(a)){if(b==="("&&c===")")return"(...)"
return b+"..."+c}t=A.r([],u.s)
B.a.k($.o,a)
try{A.dA(a,t)}finally{if(0>=$.o.length)return A.l($.o,-1)
$.o.pop()}s=A.bI(b,u.U.a(t),", ")+c
return s.charCodeAt(0)==0?s:s},
cD(a,b,c){var t,s
if(A.bt(a))return b+"..."+c
t=new A.U(b)
B.a.k($.o,a)
try{s=t
s.a=A.bI(s.a,a,", ")}finally{if(0>=$.o.length)return A.l($.o,-1)
$.o.pop()}t.a+=c
s=t.a
return s.charCodeAt(0)==0?s:s},
dA(a,b){var t,s,r,q,p,o,n,m=a.gu(a),l=0,k=0
for(;;){if(!(l<80||k<3))break
if(!m.j())return
t=A.h(m.gq())
B.a.k(b,t)
l+=t.length+2;++k}if(!m.j()){if(k<=5)return
if(0>=b.length)return A.l(b,-1)
s=b.pop()
if(0>=b.length)return A.l(b,-1)
r=b.pop()}else{q=m.gq();++k
if(!m.j()){if(k<=4){B.a.k(b,A.h(q))
return}s=A.h(q)
if(0>=b.length)return A.l(b,-1)
r=b.pop()
l+=s.length+2}else{p=m.gq();++k
for(;m.j();q=p,p=o){o=m.gq();++k
if(k>100){for(;;){if(!(l>75&&k>3))break
if(0>=b.length)return A.l(b,-1)
l-=b.pop().length+2;--k}B.a.k(b,"...")
return}}r=A.h(q)
s=A.h(p)
l+=s.length+r.length+4}}if(k>b.length+2){l+=5
n="..."}else n=null
for(;;){if(!(l>80&&b.length>3))break
if(0>=b.length)return A.l(b,-1)
l-=b.pop().length+2
if(n==null){l+=5
n="..."}}if(n!=null)B.a.k(b,n)
B.a.k(b,r)
B.a.k(b,s)},
b3:function b3(){},
b:function b(){},
an:function an(a){this.a=a},
af:function af(){},
B:function B(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
ac:function ac(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.a=c
_.b=d
_.c=e
_.d=f},
av:function av(a,b,c,d,e){var _=this
_.f=a
_.a=b
_.b=c
_.c=d
_.d=e},
aN:function aN(a){this.a=a},
as:function as(a){this.a=a},
ae:function ae(){},
m:function m(){},
aa:function aa(){},
a:function a(){},
U:function U(a){this.a=a},
cd(a,b){var t,s,r,q,p,o,n,m=null
A:{t=a instanceof A.G
if(t){s=B.k===b
r=b}else{r=m
s=!1}if(s){s=B.e
break A}q=m
if(t){q=B.b===r
s=q}else s=!1
if(s){s=B.x
break A}s=a instanceof A.A
if(s){if(t){p=r
o=t}else{p=b
r=p
o=!0}p=B.l===p}else{o=t
p=!1}if(p){s=B.j
break A}if(s)if(t){s=q
n=t
t=o}else{if(o){s=r
t=o}else{s=b
r=s
t=!0}q=B.b===s
s=q
n=!0}else{n=t
t=o
s=!1}if(s){s=B.v
break A}s=a instanceof A.F
if(s){if(t)p=r
else{p=b
r=p
t=!0}p=B.m===p}else p=!1
if(p){s=B.h
break A}if(s)if(n)s=q
else{if(t)s=r
else{s=b
r=s
t=!0}q=B.b===s
s=q
n=!0}else s=!1
if(s){s=B.w
break A}s=a instanceof A.D
if(s){if(t)p=r
else{p=b
r=p
t=!0}p=B.n===p}else p=!1
if(p){s=B.f
break A}if(s)if(n)s=q
else{if(t)s=r
else{s=b
r=s
t=!0}q=B.b===s
s=q}else s=!1
if(s){s=B.y
break A}if(a instanceof A.C)s=B.o===(t?r:b)
else s=!1
if(s){s=B.i
break A}s=m
break A}return s},
dL(a){var t
A:{if(a instanceof A.G){t="Pedido em rascunho, ainda edit\xe1vel."
break A}if(a instanceof A.A){t="Aguardando pagamento de R$ "+B.q.V(289.9,2)+"."
break A}if(a instanceof A.F){t="Pagamento confirmado via pix."
break A}if(a instanceof A.D){t="Separando 3 itens no estoque."
break A}if(a instanceof A.C){t="A caminho. Rastreio BR937284510SP."
break A}if(a instanceof A.O){t="Entregue e recebido por porteiro."
break A}if(a instanceof A.t){t="Cancelado: "+a.a+"."
break A}t=null}return t},
c9(a){var t
A:{if(a instanceof A.O||a instanceof A.t){t=!0
break A}if(a instanceof A.G||a instanceof A.A||a instanceof A.F||a instanceof A.D||a instanceof A.C){t=!1
break A}t=null}return t},
dJ(a){var t
A:{if(a instanceof A.G){t="neutro"
break A}if(a instanceof A.A){t="espera"
break A}if(a instanceof A.F||a instanceof A.D||a instanceof A.C){t="andamento"
break A}if(a instanceof A.O){t="sucesso"
break A}if(a instanceof A.t){t="falha"
break A}t=null}return t},
c7(a){var t
A:{if("rascunho"===a){t=B.u
break A}if("aguardando_pagamento"===a){t=B.e
break A}if("pago"===a){t=B.j
break A}if("em_separacao"===a){t=B.h
break A}if("despachado"===a){t=B.f
break A}if("entregue"===a){t=B.i
break A}if("cancelado"===a){t=B.z
break A}t=null
break A}return t},
dN(a){return A.cC(new A.W(B.r,u.R.a(new A.bc(a)),u.L),u.u)},
bY(a){var t,s=a.gp(),r=A.dL(a),q=A.dJ(a),p=A.c9(a)
if(A.c9(a))t=A.r([],u.s)
else{t=u.a
t=A.cG(new A.a8(new A.W(B.r,u.R.a(new A.ba(a)),u.L),u.Y.a(new A.bb()),t),t.i("m.E"))}return A.aE(["codigo",s,"descricao",r,"cor",q,"final",p,"eventos",t],u.N,u.z)},
dU(){var t,s,r="Attempting to rewrap a JS function.",q=v.G,p=new A.be()
if(typeof p=="function")A.aT(A.bh(r))
t=function(a,b){return function(){return a(b)}}(A.de,p)
s=$.bu()
t[s]=p
q.dartMaquina=t
p=new A.bf()
if(typeof p=="function")A.aT(A.bh(r))
t=function(a,b){return function(c,d){return a(b,c,d,arguments.length)}}(A.df,p)
t[s]=p
q.dartAplicar=t
q.dartPronto=!0},
aU:function aU(){},
G:function G(){},
A:function A(){},
F:function F(){},
D:function D(){},
C:function C(){},
O:function O(){},
t:function t(a){this.a=a},
e:function e(a,b){this.a=a
this.b=b},
bc:function bc(a){this.a=a},
ba:function ba(a){this.a=a},
bb:function bb(){},
be:function be(){},
bf:function bf(){},
ce(a){return v.mangledGlobalNames[a]},
dX(a){throw A.k(new A.aD("Field '"+a+"' has been assigned during initialization."),new Error())},
de(a){return u.Z.a(a).$0()},
df(a,b,c,d){u.Z.a(a)
A.b9(d)
if(d>=2)return a.$2(b,c)
if(d===1)return a.$1(b)
return a.$0()}},B={}
var w=[A,J,B]
var $={}
A.bi.prototype={}
J.aw.prototype={
v(a,b){return a===b},
gl(a){return A.aG(a)},
h(a){return"Instance of '"+A.aH(a)+"'"},
gt(a){return A.a0(A.bp(this))}}
J.az.prototype={
h(a){return String(a)},
gl(a){return a?519018:218159},
gt(a){return A.a0(u.y)},
$iv:1,
$ia_:1}
J.a3.prototype={
v(a,b){return null==b},
h(a){return"null"},
gl(a){return 0},
$iv:1}
J.R.prototype={$iP:1}
J.y.prototype={
gl(a){return 0},
h(a){return String(a)}}
J.b0.prototype={}
J.V.prototype={}
J.a5.prototype={
h(a){var t=a[$.cg()]
if(t==null)t=a[$.bu()]
if(t==null)return this.P(a)
return"JavaScript function for "+J.am(t)},
$iE:1}
J.f.prototype={
k(a,b){A.X(a).c.a(b)
a.$flags&1&&A.cc(a,29)
a.push(b)},
h(a){return A.cD(a,"[","]")},
gl(a){return A.aG(a)},
gn(a){return a.length},
I(a,b,c){A.X(a).c.a(c)
a.$flags&2&&A.cc(a)
if(!(b>=0&&b<a.length))throw A.d(A.c6(a,b))
a[b]=c},
$im:1,
$iT:1}
J.ay.prototype={
W(a){var t,s,r
if(!Array.isArray(a))return null
t=a.$flags|0
if((t&4)!==0)s="const, "
else if((t&2)!==0)s="unmodifiable, "
else s=(t&1)!==0?"fixed, ":""
r="Instance of '"+A.aH(a)+"'"
if(s==="")return r
return r+" ("+s+"length: "+a.length+")"}}
J.aV.prototype={}
J.u.prototype={
gq(){var t=this.d
return t==null?this.$ti.c.a(t):t},
j(){var t,s=this,r=s.a,q=r.length
if(s.b!==q){r=A.cb(r)
throw A.d(r)}t=s.c
if(t>=q){s.d=null
return!1}s.d=r[t]
s.c=t+1
return!0},
$iax:1}
J.a4.prototype={
V(a,b){var t,s
if(b>20)throw A.d(A.aI(b,0,20,"fractionDigits",null))
t=a.toFixed(b)
if(a===0)s=1/a<0
else s=!1
if(s)return"-"+t
return t},
h(a){if(a===0&&1/a<0)return"-0.0"
else return""+a},
gl(a){var t,s,r,q,p=a|0
if(a===p)return p&536870911
t=Math.abs(a)
s=Math.log(t)/0.6931471805599453|0
r=Math.pow(2,s)
q=t<1?t/r:r/t
return((q*9007199254740992|0)+(q*3542243181176521|0))*599197+s*1259&536870911},
L(a,b){var t
if(a>0)t=this.S(a,b)
else{t=b>31?31:b
t=a>>t>>>0}return t},
S(a,b){return b>31?0:a>>>b},
gt(a){return A.a0(u.H)},
$ial:1}
J.a2.prototype={
gt(a){return A.a0(u.S)},
$iv:1,
$ibd:1}
J.aA.prototype={
gt(a){return A.a0(u.i)},
$iv:1}
J.Q.prototype={
A(a,b,c){return a.substring(b,A.cJ(b,c,a.length))},
h(a){return a},
gl(a){var t,s,r
for(t=a.length,s=0,r=0;r<t;++r){s=s+a.charCodeAt(r)&536870911
s=s+((s&524287)<<10)&536870911
s^=s>>6}s=s+((s&67108863)<<3)&536870911
s^=s>>11
return s+((s&16383)<<15)&536870911},
gt(a){return A.a0(u.N)},
gn(a){return a.length},
$iv:1,
$ii:1}
A.aD.prototype={
h(a){return"LateInitializationError: "+this.a}}
A.a8.prototype={
gu(a){var t=this.a
return new A.a9(t.gu(t),this.b,A.bo(this).i("a9<1,2>"))},
gn(a){var t=this.a
return t.gn(t)}}
A.a9.prototype={
j(){var t=this,s=t.b
if(s.j()){t.a=t.c.$1(s.gq())
return!0}t.a=null
return!1},
gq(){var t=this.a
return t==null?this.$ti.y[1].a(t):t},
$iax:1}
A.W.prototype={
gu(a){var t=this.a
return new A.H(new J.u(t,t.length,A.X(t).i("u<1>")),this.b,this.$ti.i("H<1>"))}}
A.H.prototype={
j(){var t,s,r,q
for(t=this.a,s=this.b,r=t.$ti.c;t.j();){q=t.d
if(s.$1(q==null?r.a(q):q))return!0}return!1},
gq(){var t=this.a,s=t.d
return s==null?t.$ti.c.a(s):s},
$iax:1}
A.ad.prototype={}
A.b1.prototype={
m(a){var t,s,r=this,q=new RegExp(r.a).exec(a)
if(q==null)return null
t=Object.create(null)
s=r.b
if(s!==-1)t.arguments=q[s+1]
s=r.c
if(s!==-1)t.argumentsExpr=q[s+1]
s=r.d
if(s!==-1)t.expr=q[s+1]
s=r.e
if(s!==-1)t.method=q[s+1]
s=r.f
if(s!==-1)t.receiver=q[s+1]
return t}}
A.ab.prototype={
h(a){return"Null check operator used on a null value"}}
A.aB.prototype={
h(a){var t,s=this,r="NoSuchMethodError: method not found: '",q=s.b
if(q==null)return"NoSuchMethodError: "+s.a
t=s.c
if(t==null)return r+q+"' ("+s.a+")"
return r+q+"' on '"+t+"' ("+s.a+")"}}
A.aM.prototype={
h(a){var t=this.a
return t.length===0?"Error":"Error: "+t}}
A.b_.prototype={
h(a){return"Throw of null ('"+(this.a===null?"null":"undefined")+"' from JavaScript)"}}
A.x.prototype={
h(a){var t=this.constructor,s=t==null?null:t.name
return"Closure '"+A.cf(s==null?"unknown":s)+"'"},
$iE:1,
gZ(){return this},
$C:"$1",
$R:1,
$D:null}
A.ap.prototype={$C:"$0",$R:0}
A.aq.prototype={$C:"$2",$R:2}
A.aL.prototype={}
A.aK.prototype={
h(a){var t=this.$static_name
if(t==null)return"Closure of unknown static method"
return"Closure '"+A.cf(t)+"'"}}
A.N.prototype={
v(a,b){if(b==null)return!1
if(this===b)return!0
if(!(b instanceof A.N))return!1
return this.$_target===b.$_target&&this.a===b.a},
gl(a){return(A.dV(this.a)^A.aG(this.$_target))>>>0},
h(a){return"Closure '"+this.$_name+"' of "+("Instance of '"+A.aH(this.a)+"'")}}
A.aJ.prototype={
h(a){return"RuntimeError: "+this.a}}
A.S.prototype={
gn(a){return this.a},
M(a,b){var t,s,r=this
r.$ti.i("~(1,2)").a(b)
t=r.e
s=r.r
while(t!=null){b.$2(t.a,t.b)
if(s!==r.r)throw A.d(A.bB(r))
t=t.c}},
B(a,b){var t=this,s=t.$ti,r=new A.aY(s.c.a(a),s.y[1].a(b))
if(t.e==null)t.e=t.f=r
else t.f=t.f.c=r;++t.a
t.r=t.r+1&1073741823
return r},
U(a,b){var t,s
if(a==null)return-1
t=a.length
for(s=0;s<t;++s)if(J.cs(a[s].a,b))return s
return-1},
h(a){return A.bF(this)},
$ibE:1}
A.aY.prototype={}
A.aQ.prototype={}
A.q.prototype={
i(a){return A.ak(v.typeUniverse,this,a)},
J(a){return A.bT(v.typeUniverse,this,a)}}
A.aP.prototype={}
A.b7.prototype={
h(a){return A.n(this.a,null)}}
A.aO.prototype={
h(a){return this.a}}
A.ag.prototype={}
A.a7.prototype={
gn(a){return this.a},
h(a){return A.bF(this)},
$iaF:1}
A.aZ.prototype={
$2(a,b){var t,s=this.a
if(!s.a)this.b.a+=", "
s.a=!1
s=this.b
t=A.h(a)
s.a=(s.a+=t)+": "
t=A.h(b)
s.a+=t},
$S:0}
A.ar.prototype={}
A.at.prototype={}
A.a6.prototype={
h(a){var t=A.au(this.a)
return(this.b!=null?"Converting object to an encodable object failed:":"Converting object did not return an encodable object:")+" "+t}}
A.aC.prototype={
h(a){return"Cyclic error in JSON stringify"}}
A.aW.prototype={
C(a,b){var t=A.cN(a,this.gT().b,null)
return t},
gT(){return B.C}}
A.aX.prototype={}
A.b5.prototype={
O(a){var t,s,r,q,p,o,n=a.length
for(t=this.c,s=0,r=0;r<n;++r){q=a.charCodeAt(r)
if(q>92){if(q>=55296){p=q&64512
if(p===55296){o=r+1
o=!(o<n&&(a.charCodeAt(o)&64512)===56320)}else o=!1
if(!o)if(p===56320){p=r-1
p=!(p>=0&&(a.charCodeAt(p)&64512)===55296)}else p=!1
else p=!0
if(p){if(r>s)t.a+=B.d.A(a,s,r)
s=r+1
p=A.j(92)
t.a+=p
p=A.j(117)
t.a+=p
p=A.j(100)
t.a+=p
p=q>>>8&15
p=A.j(p<10?48+p:87+p)
t.a+=p
p=q>>>4&15
p=A.j(p<10?48+p:87+p)
t.a+=p
p=q&15
p=A.j(p<10?48+p:87+p)
t.a+=p}}continue}if(q<32){if(r>s)t.a+=B.d.A(a,s,r)
s=r+1
p=A.j(92)
t.a+=p
switch(q){case 8:p=A.j(98)
t.a+=p
break
case 9:p=A.j(116)
t.a+=p
break
case 10:p=A.j(110)
t.a+=p
break
case 12:p=A.j(102)
t.a+=p
break
case 13:p=A.j(114)
t.a+=p
break
default:p=A.j(117)
t.a+=p
p=A.j(48)
t.a=(t.a+=p)+p
p=q>>>4&15
p=A.j(p<10?48+p:87+p)
t.a+=p
p=q&15
p=A.j(p<10?48+p:87+p)
t.a+=p
break}}else if(q===34||q===92){if(r>s)t.a+=B.d.A(a,s,r)
s=r+1
p=A.j(92)
t.a+=p
p=A.j(q)
t.a+=p}}if(s===0)t.a+=a
else if(s<n)t.a+=B.d.A(a,s,n)},
E(a){var t,s,r,q
for(t=this.a,s=t.length,r=0;r<s;++r){q=t[r]
if(a==null?q==null:a===q)throw A.d(new A.aC(a,null))}B.a.k(t,a)},
D(a){var t,s,r,q,p=this
if(p.N(a))return
p.E(a)
try{t=p.b.$1(a)
if(!p.N(t)){r=A.bD(a,null,p.gK())
throw A.d(r)}r=p.a
if(0>=r.length)return A.l(r,-1)
r.pop()}catch(q){s=A.dZ(q)
r=A.bD(a,s,p.gK())
throw A.d(r)}},
N(a){var t,s,r=this
if(typeof a=="number"){if(!isFinite(a))return!1
r.c.a+=B.q.h(a)
return!0}else if(a===!0){r.c.a+="true"
return!0}else if(a===!1){r.c.a+="false"
return!0}else if(a==null){r.c.a+="null"
return!0}else if(typeof a=="string"){t=r.c
t.a+='"'
r.O(a)
t.a+='"'
return!0}else if(u.j.b(a)){r.E(a)
r.X(a)
t=r.a
if(0>=t.length)return A.l(t,-1)
t.pop()
return!0}else if(a instanceof A.S){r.E(a)
s=r.Y(a)
t=r.a
if(0>=t.length)return A.l(t,-1)
t.pop()
return s}else return!1},
X(a){var t,s,r=this.c
r.a+="["
t=a.length
if(t!==0){if(0>=t)return A.l(a,0)
this.D(a[0])
for(s=1;s<a.length;++s){r.a+=","
this.D(a[s])}}r.a+="]"},
Y(a){var t,s,r,q,p,o=this,n={},m=a.a
if(m===0){o.c.a+="{}"
return!0}m*=2
t=A.cH(m,null,u.X)
s=n.a=0
n.b=!0
a.M(0,new A.b6(n,t))
if(!n.b)return!1
r=o.c
r.a+="{"
for(q='"';s<m;s+=2,q=',"'){r.a+=q
o.O(A.Y(t[s]))
r.a+='":'
p=s+1
if(!(p<m))return A.l(t,p)
o.D(t[p])}r.a+="}"
return!0}}
A.b6.prototype={
$2(a,b){var t,s
if(typeof a!="string")this.a.b=!1
t=this.b
s=this.a
B.a.I(t,s.a++,a)
B.a.I(t,s.a++,b)},
$S:0}
A.b4.prototype={
gK(){var t=this.c.a
return t.charCodeAt(0)==0?t:t}}
A.b3.prototype={
h(a){return this.R()}}
A.b.prototype={}
A.an.prototype={
h(a){var t=this.a
if(t!=null)return"Assertion failed: "+A.au(t)
return"Assertion failed"}}
A.af.prototype={}
A.B.prototype={
gG(){return"Invalid argument"+(!this.a?"(s)":"")},
gF(){return""},
h(a){var t=this,s=t.c,r=s==null?"":" ("+s+")",q=t.d,p=q==null?"":": "+q,o=t.gG()+r+p
if(!t.a)return o
return o+t.gF()+": "+A.au(t.gH())},
gH(){return this.b}}
A.ac.prototype={
gH(){return A.bW(this.b)},
gG(){return"RangeError"},
gF(){var t,s=this.e,r=this.f
if(s==null)t=r!=null?": Not less than or equal to "+A.h(r):""
else if(r==null)t=": Not greater than or equal to "+A.h(s)
else if(r>s)t=": Not in inclusive range "+A.h(s)+".."+A.h(r)
else t=r<s?": Valid value range is empty":": Only valid value is "+A.h(s)
return t}}
A.av.prototype={
gH(){return A.b9(this.b)},
gG(){return"RangeError"},
gF(){if(A.b9(this.b)<0)return": index must not be negative"
var t=this.f
if(t===0)return": no indices are valid"
return": index should be less than "+t},
gn(a){return this.f}}
A.aN.prototype={
h(a){return"Unsupported operation: "+this.a}}
A.as.prototype={
h(a){var t=this.a
if(t==null)return"Concurrent modification during iteration."
return"Concurrent modification during iteration: "+A.au(t)+"."}}
A.ae.prototype={
h(a){return"Stack Overflow"},
$ib:1}
A.m.prototype={
gn(a){var t,s=this.gu(this)
for(t=0;s.j();)++t
return t},
h(a){return A.cE(this,"(",")")}}
A.aa.prototype={
gl(a){return A.a.prototype.gl.call(this,0)},
h(a){return"null"}}
A.a.prototype={$ia:1,
v(a,b){return this===b},
gl(a){return A.aG(this)},
h(a){return"Instance of '"+A.aH(this)+"'"},
gt(a){return A.dQ(this)},
toString(){return this.h(this)}}
A.U.prototype={
gn(a){return this.a.length},
h(a){var t=this.a
return t.charCodeAt(0)==0?t:t},
$icL:1}
A.aU.prototype={}
A.G.prototype={
gp(){return"rascunho"}}
A.A.prototype={
gp(){return"aguardando_pagamento"}}
A.F.prototype={
gp(){return"pago"}}
A.D.prototype={
gp(){return"em_separacao"}}
A.C.prototype={
gp(){return"despachado"}}
A.O.prototype={
gp(){return"entregue"}}
A.t.prototype={
gp(){return"cancelado"}}
A.e.prototype={
R(){return"Evento."+this.b}}
A.bc.prototype={
$1(a){return u.u.a(a).b===this.a},
$S:1}
A.ba.prototype={
$1(a){return A.cd(this.a,u.u.a(a))!=null},
$S:1}
A.bb.prototype={
$1(a){return u.u.a(a).b},
$S:2}
A.be.prototype={
$0(){var t,s,r=["rascunho","aguardando_pagamento","pago","em_separacao","despachado","entregue","cancelado"],q=A.r([],u.t)
for(t=0;t<7;++t){s=A.c7(r[t])
s.toString
q.push(A.bY(s))}return B.c.C(A.aE(["inicial","rascunho","estados",q],u.N,u.K),null)},
$S:3}
A.bf.prototype={
$2(a,b){var t,s,r,q
A.Y(a)
A.Y(b)
t=A.c7(a)
s=A.dN(b)
if(t==null||s==null){r=u.N
return B.c.C(A.aE(["erro","estado ou evento desconhecido"],r,r),null)}q=A.cd(t,s)
if(q==null){r=u.N
return B.c.C(A.aE(["erro",'de "'+t.gp()+'" n\xe3o existe transi\xe7\xe3o por "'+s.b+'"'],r,r),null)}return B.c.C(A.aE(["estado",A.bY(q)],u.N,u.c),null)},
$S:4};(function aliases(){var t=J.y.prototype
t.P=t.h})();(function installTearOffs(){var t=hunkHelpers._static_1
t(A,"dI","dg",5)})();(function inheritance(){var t=hunkHelpers.inherit,s=hunkHelpers.inheritMany
t(A.a,null)
s(A.a,[A.bi,J.aw,A.ad,J.u,A.b,A.m,A.a9,A.H,A.b1,A.b_,A.x,A.a7,A.aY,A.aQ,A.q,A.aP,A.b7,A.ar,A.at,A.b5,A.b3,A.ae,A.aa,A.U,A.aU])
s(J.aw,[J.az,J.a3,J.R,J.a4,J.Q])
s(J.R,[J.y,J.f])
s(J.y,[J.b0,J.V,J.a5])
t(J.ay,A.ad)
t(J.aV,J.f)
s(J.a4,[J.a2,J.aA])
s(A.b,[A.aD,A.af,A.aB,A.aM,A.aJ,A.aO,A.a6,A.an,A.B,A.aN,A.as])
s(A.m,[A.a8,A.W])
t(A.ab,A.af)
s(A.x,[A.ap,A.aq,A.aL,A.bc,A.ba,A.bb])
s(A.aL,[A.aK,A.N])
t(A.S,A.a7)
t(A.ag,A.aO)
s(A.aq,[A.aZ,A.b6,A.bf])
t(A.aC,A.a6)
t(A.aW,A.ar)
t(A.aX,A.at)
t(A.b4,A.b5)
s(A.B,[A.ac,A.av])
s(A.aU,[A.G,A.A,A.F,A.D,A.C,A.O,A.t])
t(A.e,A.b3)
t(A.be,A.ap)})()
var v={G:typeof self!="undefined"?self:globalThis,typeUniverse:{eC:new Map(),tR:{},eT:{},tPV:{},sEA:[]},mangledGlobalNames:{bd:"int",c8:"double",al:"num",i:"String",a_:"bool",aa:"Null",T:"List",a:"Object",aF:"Map",P:"JSObject"},mangledNames:{},types:["~(a?,a?)","a_(e)","i(e)","i()","i(i,i)","@(@)"],arrayRti:Symbol("$ti"),rttc:{}}
A.d1(v.typeUniverse,JSON.parse('{"b0":"y","V":"y","a5":"y","az":{"a_":[],"v":[]},"a3":{"v":[]},"R":{"P":[]},"y":{"P":[]},"f":{"T":["1"],"P":[],"m":["1"]},"ay":{"ad":[]},"aV":{"f":["1"],"T":["1"],"P":[],"m":["1"]},"u":{"ax":["1"]},"a4":{"al":[]},"a2":{"bd":[],"al":[],"v":[]},"aA":{"al":[],"v":[]},"Q":{"i":[],"v":[]},"aD":{"b":[]},"a8":{"m":["2"],"m.E":"2"},"a9":{"ax":["2"]},"W":{"m":["1"],"m.E":"1"},"H":{"ax":["1"]},"ab":{"b":[]},"aB":{"b":[]},"aM":{"b":[]},"x":{"E":[]},"ap":{"E":[]},"aq":{"E":[]},"aL":{"E":[]},"aK":{"E":[]},"N":{"E":[]},"aJ":{"b":[]},"S":{"a7":["1","2"],"bE":["1","2"],"aF":["1","2"]},"aO":{"b":[]},"ag":{"b":[]},"a7":{"aF":["1","2"]},"a6":{"b":[]},"aC":{"b":[]},"T":{"m":["1"]},"an":{"b":[]},"af":{"b":[]},"B":{"b":[]},"ac":{"b":[]},"av":{"b":[]},"aN":{"b":[]},"as":{"b":[]},"ae":{"b":[]},"U":{"cL":[]}}'))
A.d0(v.typeUniverse,JSON.parse('{"ar":2,"at":2}'))
var u=(function rtii(){var t=A.aR
return{C:t("b"),u:t("e"),Z:t("E"),U:t("m<@>"),t:t("f<aF<i,@>>"),s:t("f<i>"),b:t("f<@>"),T:t("a3"),m:t("P"),g:t("a5"),j:t("T<@>"),c:t("aF<i,@>"),a:t("a8<e,i>"),P:t("aa"),K:t("a"),J:t("e2"),F:t("+()"),N:t("i"),Y:t("i(e)"),k:t("v"),o:t("V"),L:t("W<e>"),y:t("a_"),R:t("a_(e)"),i:t("c8"),z:t("@"),S:t("bd"),O:t("bC<aa>?"),A:t("P?"),X:t("a?"),v:t("i?"),d:t("a_?"),I:t("c8?"),w:t("bd?"),n:t("al?"),H:t("al")}})();(function constants(){var t=hunkHelpers.makeConstList
B.A=J.aw.prototype
B.a=J.f.prototype
B.p=J.a2.prototype
B.q=J.a4.prototype
B.d=J.Q.prototype
B.B=J.R.prototype
B.e=new A.A()
B.f=new A.C()
B.h=new A.D()
B.i=new A.O()
B.t=function getTagFallback(o) {
  var s = Object.prototype.toString.call(o);
  return s.substring(8, s.length - 1);
}
B.c=new A.aW()
B.j=new A.F()
B.u=new A.G()
B.v=new A.t("pagamento n\xe3o confirmado")
B.w=new A.t("cancelado ap\xf3s pagamento \u2014 gera estorno")
B.x=new A.t("desistiu antes de fechar")
B.y=new A.t("cancelado na separa\xe7\xe3o")
B.z=new A.t("cancelado")
B.k=new A.e(0,"enviarParaPagamento")
B.l=new A.e(1,"pagar")
B.m=new A.e(2,"separar")
B.n=new A.e(3,"despachar")
B.o=new A.e(4,"entregar")
B.b=new A.e(5,"cancelar")
B.C=new A.aX(null)
B.r=t([B.k,B.l,B.m,B.n,B.o,B.b],A.aR("f<e>"))})();(function staticFields(){$.o=A.r([],A.aR("f<a>"))
$.bG=null
$.by=null
$.bx=null
$.ed=A.r([],A.aR("f<T<a>?>"))})();(function lazyInitializers(){var t=hunkHelpers.lazyFinal
t($,"e0","cg",()=>A.ca("_$dart_dartClosure"))
t($,"e_","bu",()=>A.ca("_$dart_dartClosure_dartJSInterop"))
t($,"ee","cr",()=>A.r([new J.ay()],A.aR("f<ad>")))
t($,"e3","ch",()=>A.w(A.b2({
toString:function(){return"$receiver$"}})))
t($,"e4","ci",()=>A.w(A.b2({$method$:null,
toString:function(){return"$receiver$"}})))
t($,"e5","cj",()=>A.w(A.b2(null)))
t($,"e6","ck",()=>A.w(function(){var $argumentsExpr$="$arguments$"
try{null.$method$($argumentsExpr$)}catch(s){return s.message}}()))
t($,"e9","cn",()=>A.w(A.b2(void 0)))
t($,"ea","co",()=>A.w(function(){var $argumentsExpr$="$arguments$"
try{(void 0).$method$($argumentsExpr$)}catch(s){return s.message}}()))
t($,"e8","cm",()=>A.w(A.bJ(null)))
t($,"e7","cl",()=>A.w(function(){try{null.$method$}catch(s){return s.message}}()))
t($,"ec","cq",()=>A.w(A.bJ(void 0)))
t($,"eb","cp",()=>A.w(function(){try{(void 0).$method$}catch(s){return s.message}}()))})();(function nativeSupport(){!function(){var t=function(a){var n={}
n[a]=1
return Object.keys(hunkHelpers.convertToFastObject(n))[0]}
v.getIsolateTag=function(a){return t("___dart_"+a+v.isolateTag)}
var s="___dart_isolate_tags_"
var r=Object[s]||(Object[s]=Object.create(null))
var q="_ZxYxX"
for(var p=0;;p++){var o=t(q+"_"+p+"_")
if(!(o in r)){r[o]=1
v.isolateTag=o
break}}}()
hunkHelpers.setOrUpdateInterceptorsByTag({})
hunkHelpers.setOrUpdateLeafTags({})})()
Function.prototype.$0=function(){return this()}
Function.prototype.$2=function(a,b){return this(a,b)}
Function.prototype.$1=function(a){return this(a)}
convertAllToFastObject(w)
convertToFastObject($);(function(a){if(typeof document==="undefined"){a(null)
return}if(typeof document.currentScript!="undefined"){a(document.currentScript)
return}var t=document.scripts
function onLoad(b){for(var r=0;r<t.length;++r){t[r].removeEventListener("load",onLoad,false)}a(b.target)}for(var s=0;s<t.length;++s){t[s].addEventListener("load",onLoad,false)}})(function(a){v.currentScript=a
var t=A.dU
if(typeof dartMainRunner==="function"){dartMainRunner(t,[])}else{t([])}})})()
//# sourceMappingURL=pedido.js.map
