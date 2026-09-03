/* NeuroTrocity 3D cortex — dendritic network in real 3D, projected to 2D canvas.
   Rotation + perspective + depth-sorted painting are what make it read as volume.

   Every pass is additive ('lighter'), so overlapping strands accumulate light the
   way a long-exposure photograph does. That is where the depth comes from — not
   from any single element being bright, but from hundreds of dim ones stacking. */
window.NTCortex=function(canvas,opt){
  opt=opt||{};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var x=canvas.getContext('2d'); if(!x) return null;
  var DPR=Math.min(2,window.devicePixelRatio||1);
  var PAL=[[150,130,255],[74,238,224],[255,120,205],[120,235,165]];
  var HUBS=opt.hubs||8, MAXF=opt.maxFibers||200, LEN=opt.branchLen||0.6,
      SPREAD=opt.spread||0.85, LA=opt.lineAlpha==null?0.5:opt.lineAlpha,
      NA=opt.nodeAlpha==null?1:opt.nodeAlpha, FIRE=opt.fire||0.09,
      SPIN=opt.spin==null?0.075:opt.spin, RS=opt.radius||0.42,
      BLOOM=opt.bloom==null?1:opt.bloom,          /* fibre glow pass strength */
      DUST=opt.dust==null?90:opt.dust;            /* background motes for volume */
  var view={yaw:0,pitch:-0.1,dist:3.0,zoom:1};
  var nodes=[],fibers=[],somas=[],sig=[],rings=[],dust=[];
  var W,H,CX,CY,R,sized=false,running=false,raf=null,t0=performance.now();
  var autoYaw=0,mx=0,my=0,tmx=0,tmy=0;
  var FOV=2.4;

  function rnd(){return Math.random()}
  function dir3(){var u=rnd()*2-1,t=rnd()*6.2832,s=Math.sqrt(1-u*u);return[s*Math.cos(t),s*Math.sin(t),u]}
  function nrm(v){var m=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1;return[v[0]/m,v[1]/m,v[2]/m]}
  function add(p,c,soma){nodes.push({x:p[0],y:p[1],z:p[2],c:c,out:[],ph:rnd()*6.2832,e:0,s:!!soma});return nodes.length-1}
  function branch(pi,d,len,depth,c){
    if(depth>4||fibers.length>MAXF)return;
    var p=nodes[pi],l=len*(0.7+rnd()*0.55);
    var e=[p.x+d[0]*l,p.y+d[1]*l,p.z+d[2]*l];
    var ni=add(e,c,false);
    var per=dir3(),o=l*0.3;
    fibers.push({a:pi,b:ni,
      kx:(p.x+e[0])/2+per[0]*o,ky:(p.y+e[1])/2+per[1]*o,kz:(p.z+e[2])/2+per[2]*o,
      c:c,w:Math.max(0.55,(5-depth)*0.85),e:0});
    nodes[pi].out.push(fibers.length-1);
    var kids=depth<2?(rnd()<0.65?2:1):(rnd()<0.5?1:0);
    for(var k=0;k<kids;k++)
      branch(ni,nrm([d[0]+(rnd()-0.5)*1.5,d[1]+(rnd()-0.5)*1.5,d[2]+(rnd()-0.5)*1.5]),
             l*0.74,depth+1,rnd()<0.2?PAL[(rnd()*PAL.length)|0]:c);
  }
  function grow(){
    nodes=[];fibers=[];somas=[];sig=[];rings=[];dust=[];
    for(var h=0;h<HUBS;h++){
      var c=PAL[(rnd()*PAL.length)|0],d=dir3(),rr=Math.pow(rnd(),0.55)*SPREAD;
      var hi=add([d[0]*rr,d[1]*rr,d[2]*rr],c,true);
      somas.push(hi);
      var prim=4+(rnd()*3|0);
      for(var i=0;i<prim;i++)branch(hi,dir3(),LEN,1,c);
    }
    /* motes sit in a shell around the structure — they read as depth haze,
       and because they share the projection they parallax correctly */
    for(var m=0;m<DUST;m++){
      var dd=dir3(),rr2=1.15+rnd()*1.15;
      dust.push({x:dd[0]*rr2,y:dd[1]*rr2,z:dd[2]*rr2,
                 c:PAL[(rnd()*PAL.length)|0],ph:rnd()*6.2832,p:{}});
    }
  }

  var cyw,syw,cpt,spt,kNear,kFar,kSpan;
  function setRot(){
    var yaw=view.yaw+autoYaw+mx, pit=view.pitch+my;
    cyw=Math.cos(yaw);syw=Math.sin(yaw);cpt=Math.cos(pit);spt=Math.sin(pit);
    kNear=FOV/Math.max(0.2,FOV+view.dist-1.35);
    kFar =FOV/Math.max(0.2,FOV+view.dist+1.35);
    kSpan=(kNear-kFar)||1;
  }
  function pr(px,py,pz,o){
    var x1=px*cyw-pz*syw, z1=px*syw+pz*cyw;
    var y2=py*cpt-z1*spt, z2=py*spt+z1*cpt;
    var k=FOV/Math.max(0.2,FOV+z2+view.dist);
    o.x=CX+x1*k*R*view.zoom; o.y=CY+y2*k*R*view.zoom; o.k=k;
    o.d=Math.max(0,Math.min(1,(k-kFar)/kSpan));
    return o;
  }
  function size(){
    var r=canvas.getBoundingClientRect(); if(!r.width||!r.height)return false;
    var nw=Math.max(2,Math.round(r.width*DPR)),nh=Math.max(2,Math.round(r.height*DPR));
    if(sized&&nw===W&&nh===H)return true;
    W=canvas.width=nw;H=canvas.height=nh;
    /* opt.fit keeps the whole structure inside a panel that must not look clipped
       (the hero). Full-bleed backgrounds like the contact cards leave it off and
       are happy to run past the edges. */
    var portrait=W<H;
    CX=W*(opt.cx==null?0.5:(opt.fit&&portrait?0.5:opt.cx));
    CY=H*(opt.cy==null?0.5:opt.cy);
    R=Math.sqrt(W*H)*RS;
    if(opt.fit) R=Math.min(R,Math.min(W,H)*0.46);
    sized=true;
    if(!nodes.length)grow();
    return true;
  }
  function emit(fi){if(sig.length>34)return;fibers[fi].e=1;sig.push({f:fi,t:0,v:0.011+rnd()*0.014})}
  function fire(ni){
    var n=nodes[ni];if(!n||!n.out.length)return;
    n.e=1;
    /* a firing soma throws a shockwave, so the eye is pulled to the event */
    if(n.s&&rings.length<10)rings.push({x:n.x,y:n.y,z:n.z,c:n.c,t:0,p:{}});
    emit(n.out[(rnd()*n.out.length)|0]);
  }

  var pa={},pb={},pk={},ps={},pd={};
  function frame(){
    var el=(performance.now()-t0)/1000;
    if(!reduce){
      autoYaw+=SPIN*0.016;
      mx+=(tmx-mx)*0.05; my+=(tmy-my)*0.05;
    }
    setRot();
    x.clearRect(0,0,W,H);
    x.globalCompositeOperation='lighter';
    x.lineCap='round';
    /* slow global breath — keeps a static frame from ever looking frozen */
    var gp=reduce?1:(0.94+0.06*Math.sin(el*0.55));

    /* ---- dust: drawn first so the structure sits in front of it ---- */
    for(var i=0;i<dust.length;i++){
      var m=dust[i]; pr(m.x,m.y,m.z,m.p);
      var tw=0.5+0.5*Math.sin(el*0.9+m.ph);
      var a=(0.05+0.20*Math.pow(m.p.d,2))*tw*gp;
      x.fillStyle='rgba('+m.c[0]+','+m.c[1]+','+m.c[2]+','+a.toFixed(3)+')';
      x.beginPath();x.arc(m.p.x,m.p.y,(0.5+1.3*m.p.d)*DPR,0,6.2832);x.fill();
    }

    /* project nodes once */
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i]; if(!n.p)n.p={};
      pr(n.x,n.y,n.z,n.p);
    }
    /* ---- fibres, far → near, two passes: wide bloom then bright core ---- */
    var ord=[];
    for(var i=0;i<fibers.length;i++){
      var f=fibers[i]; f.md=(nodes[f.a].p.d+nodes[f.b].p.d)*0.5; ord.push(i);
    }
    ord.sort(function(a,b){return fibers[a].md-fibers[b].md});
    for(var q=0;q<ord.length;q++){
      var f=fibers[ord[q]]; if(f.e>0)f.e*=0.94;
      var A=nodes[f.a].p,B=nodes[f.b].p,d=f.md;
      pr(f.kx,f.ky,f.kz,pk);
      var hot=f.e>0.5;
      var base=LA*(0.10+0.90*Math.pow(d,1.6))*gp;
      x.beginPath();x.moveTo(A.x,A.y);x.quadraticCurveTo(pk.x,pk.y,B.x,B.y);
      if(BLOOM>0){
        x.strokeStyle='rgba('+f.c[0]+','+f.c[1]+','+f.c[2]+','+Math.min(1,base*0.30*BLOOM*(1+f.e*2)).toFixed(3)+')';
        x.lineWidth=Math.max(1,f.w*(0.9+4.2*d))*DPR;
        x.stroke();
      }
      var cr=hot?255:f.c[0],cg=hot?255:f.c[1],cb=hot?255:f.c[2];
      x.strokeStyle='rgba('+cr+','+cg+','+cb+','+Math.min(1,base*(0.62+f.e*1.7)).toFixed(3)+')';
      x.lineWidth=Math.max(0.4,f.w*(0.22+1.35*d))*DPR;
      x.stroke();
    }
    /* ---- nodes, far → near ---- */
    var nord=[];for(var i=0;i<nodes.length;i++)nord.push(i);
    nord.sort(function(a,b){return nodes[a].p.d-nodes[b].p.d});
    for(var q=0;q<nord.length;q++){
      var n=nodes[nord[q]],P=n.p,d=P.d;
      if(n.e>0)n.e*=0.94;
      var tw=0.55+0.45*Math.sin(el*1.5+n.ph);
      var sm=n.s?1.7:1;
      /* outer haze */
      var hr=(2.2+10*d)*sm*DPR*(0.8+0.35*tw);
      var ha=((0.035+0.17*Math.pow(d,1.4))*NA*(0.75+0.5*tw)+n.e*0.22)*gp;
      x.fillStyle='rgba('+n.c[0]+','+n.c[1]+','+n.c[2]+','+Math.min(1,ha).toFixed(3)+')';
      x.beginPath();x.arc(P.x,P.y,hr,0,6.2832);x.fill();
      /* body, washed toward white as it comes forward */
      var w=0.35+0.55*d;
      var cc0=n.c[0]+(255-n.c[0])*w,cc1=n.c[1]+(255-n.c[1])*w,cc2=n.c[2]+(255-n.c[2])*w;
      var cr2=(0.45+2.1*d)*sm*DPR+n.e*1.6*DPR;
      var ca=((0.22+0.78*Math.pow(d,1.2))*NA*(0.6+0.5*tw)+n.e*0.5)*gp;
      x.fillStyle='rgba('+(cc0|0)+','+(cc1|0)+','+(cc2|0)+','+Math.min(1,ca).toFixed(3)+')';
      x.beginPath();x.arc(P.x,P.y,cr2,0,6.2832);x.fill();
      /* white-hot pinpoint on the somas — gives the cluster real centres */
      if(n.s){
        var pr2=(0.5+0.9*d)*DPR*(0.85+0.3*tw)+n.e*1.4*DPR;
        x.fillStyle='rgba(255,255,255,'+Math.min(1,(0.30+0.5*d)*NA+n.e*0.5).toFixed(3)+')';
        x.beginPath();x.arc(P.x,P.y,pr2,0,6.2832);x.fill();
      }
    }
    /* ---- shockwaves from firing somas ---- */
    for(var k=rings.length-1;k>=0;k--){
      var g=rings[k]; g.t+=0.028;
      if(g.t>=1){rings.splice(k,1);continue}
      pr(g.x,g.y,g.z,g.p);
      var rr=g.p.d*R*view.zoom*0.42*g.t;
      var a=(1-g.t)*(1-g.t)*0.55*g.p.d*gp;
      x.strokeStyle='rgba('+g.c[0]+','+g.c[1]+','+g.c[2]+','+a.toFixed(3)+')';
      x.lineWidth=Math.max(0.5,(1.6-1.2*g.t)*DPR);
      x.beginPath();x.arc(g.p.x,g.p.y,Math.max(0.5,rr),0,6.2832);x.stroke();
    }
    /* ---- travelling signals, drawn as short comets ---- */
    if(!reduce){
      for(var k=sig.length-1;k>=0;k--){
        var s=sig[k],f=fibers[s.f]; s.t+=s.v;
        if(s.t>=1){fire(f.b);sig.splice(k,1);continue}
        var A=nodes[f.a],B=nodes[f.b];
        for(var tail=0;tail<5;tail++){
          var tt=s.t-tail*0.045; if(tt<0)break;
          var u=1-tt;
          pr(u*u*A.x+2*u*tt*f.kx+tt*tt*B.x,
             u*u*A.y+2*u*tt*f.ky+tt*tt*B.y,
             u*u*A.z+2*u*tt*f.kz+tt*tt*B.z, ps);
          var fade=(1-tail/5);
          x.fillStyle='rgba(255,255,255,'+((0.30+0.6*ps.d)*fade*fade).toFixed(3)+')';
          x.beginPath();x.arc(ps.x,ps.y,(0.6+2.0*ps.d)*fade*DPR,0,6.2832);x.fill();
        }
      }
      if(Math.random()<FIRE)fire(somas[(Math.random()*somas.length)|0]);
    }
    x.globalCompositeOperation='source-over';
    if(running)raf=requestAnimationFrame(frame);
  }

  function start(){if(running||reduce)return;if(!size())return;running=true;frame()}
  function stop(){running=false;if(raf)cancelAnimationFrame(raf)}
  function once(){if(!size())return;for(var i=0;i<somas.length;i++)fire(somas[i]);frame()}

  if(opt.parallax!==false){
    canvas.addEventListener('pointermove',function(ev){
      var r=canvas.getBoundingClientRect();
      tmx=((ev.clientX-r.left)/r.width-0.5)*0.55;
      tmy=((ev.clientY-r.top)/r.height-0.5)*0.3;
    });
    canvas.addEventListener('pointerleave',function(){tmx=0;tmy=0});
  }
  if('ResizeObserver' in window)new ResizeObserver(function(){if(size()&&!running)frame()}).observe(canvas);
  addEventListener('resize',function(){if(size()&&!running)frame()});
  size();
  if(reduce)once();
  else if('IntersectionObserver' in window)
    new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?start():stop()})},{rootMargin:'180px'}).observe(canvas);
  else start();

  return {view:view,start:start,stop:stop,resize:size,reduce:reduce};
};
