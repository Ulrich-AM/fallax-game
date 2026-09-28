import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=60';

const ANCHOR_SPRITE_ASSET = {"version":2,"name":"anchor","displayName":"anchor","type":"weapon","scale":1,"pivot":[0,0],"parts":[{"id":"polygon-1","name":"polygon-1","type":"polygon","material":"glow-red","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[0,0],[1,-2],[10,0]]},{"id":"polygon-mirror-2","name":"polygon-1 mirror","type":"polygon","material":"glow-red","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[10,0],[1,2],[0,0]]},{"id":"polygon-3","name":"polygon-3","type":"polygon","material":"dark-gray","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[-2,0],[-1,-2],[-5,-2],[-6,-1],[-6,0]]},{"id":"polygon-mirror-4","name":"polygon-3 mirror","type":"polygon","material":"dark-gray","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[-6,0],[-6,1],[-5,2],[-1,2],[-2,0]]}],"groups":[],"hitboxes":[],"animations":{"clips":{"fire":{"name":"fire","duration":0.25,"loop":false,"tracks":[]},"special":{"name":"special","duration":0.6,"loop":false,"tracks":[]}}},"markers":{"muzzle":{"x":10,"y":0,"rotation":0}},"render":{"mergeOutlines":true,"outline":{"enabled":true,"color":"#35383e","thickness":1},"padding":2}};

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function segmentRectIntersection(x0,y0,x1,y1,r){
  const dx=x1-x0,dy=y1-y0;
  let t0=0,t1=1;
  for(const [p,q] of [[-dx,x0-r.x],[dx,r.x+r.w-x0],[-dy,y0-r.y],[dy,r.y+r.h-y0]]){
    if(Math.abs(p)<1e-6){if(q<0)return null;continue;}
    const t=q/p;
    if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);
    if(t0>t1)return null;
  }
  return {t:t0,x:x0+dx*t0,y:y0+dy*t0};
}

export class AnchorWeapon {
  constructor(){
    this.name='Anchor';
    this.orbitRadius=44;
    this.projectileSpeed=920;
    this.projectileLife=2.6;
    this.projectileDamage=8;
    this.fireCooldown=.78;
    this.fireTimer=0;

    this.tetherSlack=310;
    this.tetherSnapDistance=820;
    this.tetherBaseDps=4;
    this.tetherStretchDps=.05;
    this.tetherMaxDps=28;
    this.snapBaseDamage=18;

    this.specialCooldown=8;
    this.specialCooldownTimer=this.specialCooldown;
    this.reelDuration=.65;
    this.reelTimer=0;

    this.projectile=null;
    this.anchor=null;
    this.shotSerial=0;

    this.sprite=new WeaponSpriteRenderer(ANCHOR_SPRITE_ASSET);
  }

  reset(){
    this.fireTimer=0;
    this.specialCooldownTimer=this.specialCooldown;
    this.reelTimer=0;
    this.projectile=null;
    this.anchor=null;
    this.shotSerial=0;
  }

  getAim(player,pointerWorld){
    const angle=Math.atan2(pointerWorld.y-player.y,pointerWorld.x-player.x);
    return {
      angle,
      x:player.x+Math.cos(angle)*this.orbitRadius,
      y:player.y+Math.sin(angle)*this.orbitRadius,
    };
  }

  fire(player,pointerWorld,artPixelSize){
    const aim=this.getAim(player,pointerWorld);
    const muzzle=this.sprite.getMarkerWorldPosition(
      'muzzle',aim.x,aim.y,aim.angle,artPixelSize
    );

    this.projectile={
      x:muzzle.x,y:muzzle.y,prevX:muzzle.x,prevY:muzzle.y,
      vx:Math.cos(aim.angle)*this.projectileSpeed,
      vy:Math.sin(aim.angle)*this.projectileSpeed,
      life:this.projectileLife,
      maxLife:this.projectileLife,
    };

    this.anchor=null;
    this.shotSerial++;
  }

  surfaceHit(p,world){
    const x0=p.prevX,y0=p.prevY,x1=p.x,y1=p.y;
    let best=null;
    const consider=h=>{if(h&&h.t>=0&&h.t<=1&&(!best||h.t<best.t))best=h;};

    if(x1<=0&&x0>0){
      const t=(0-x0)/(x1-x0);
      consider({t,x:1,y:y0+(y1-y0)*t});
    }
    if(x1>=world.width&&x0<world.width){
      const t=(world.width-x0)/(x1-x0);
      consider({t,x:world.width-1,y:y0+(y1-y0)*t});
    }
    if(Number.isFinite(world.roofY)&&y1<=world.roofY&&y0>world.roofY){
      const t=(world.roofY-y0)/(y1-y0);
      consider({t,x:x0+(x1-x0)*t,y:world.roofY+1});
    }
    if(y1>=world.floorY&&y0<world.floorY){
      const t=(world.floorY-y0)/(y1-y0);
      consider({t,x:x0+(x1-x0)*t,y:world.floorY-1});
    }

    for(const r of world.platforms??[]){
      const h=segmentRectIntersection(x0,y0,x1,y1,r);
      if(h) consider(h);
    }
    return best;
  }

  attachBoss(target,x,y){
    this.anchor={
      mode:'boss',
      target,
      offsetX:x-target.x,
      offsetY:y-target.y,
      x,y,
    };
    this.projectile=null;
  }

  attachSurface(x,y){
    this.anchor={mode:'surface',x,y,target:null};
    this.projectile=null;
  }

  anchorPosition(){
    if(!this.anchor)return null;
    if(this.anchor.mode==='boss'&&this.anchor.target){
      this.anchor.x=this.anchor.target.x+this.anchor.offsetX;
      this.anchor.y=this.anchor.target.y+this.anchor.offsetY;
    }
    return this.anchor;
  }

  tension(player){
    const a=this.anchorPosition();
    if(!a)return {distance:0,excess:0,ratio:0};
    const distance=Math.hypot(a.x-player.x,a.y-player.y);
    const excess=Math.max(0,distance-this.tetherSlack);
    return {
      distance,excess,
      ratio:clamp(excess/(this.tetherSnapDistance-this.tetherSlack),0,1),
    };
  }

  triggerSpecial({player}={}){
    if(this.specialCooldownTimer>0||!this.anchor||!player)return false;

    this.specialCooldownTimer=this.specialCooldown;
    this.reelTimer=this.reelDuration;

    if(this.anchor.mode==='boss'&&this.anchor.target&&!this.anchor.target.dead){
      const t=this.tension(player);
      this.anchor.target.takeDamage?.(8+t.ratio*24);
    }
    return true;
  }

  get specialAbilities(){
    return [{
      id:'anchor-reel',
      name:'reel',
      cooldown:this.specialCooldown,
      remaining:this.specialCooldownTimer,
      active:this.reelTimer>0,
    }];
  }

  update(dt,player,pointerWorld,firing,world,target,artPixelSize,active=true){
    this.fireTimer=Math.max(0,this.fireTimer-dt);
    if(active)this.specialCooldownTimer=Math.max(0,this.specialCooldownTimer-dt);
    this.reelTimer=Math.max(0,this.reelTimer-dt);

    if(active&&firing&&this.fireTimer<=0){
      this.fire(player,pointerWorld,artPixelSize);
      this.fireTimer=this.fireCooldown;
    }

    if(this.projectile){
      const p=this.projectile;
      p.prevX=p.x;p.prevY=p.y;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;

      if(
        p.life>0&&target&&!target.dead&&
        target.hitTest?.(p.x,p.y,6)
      ){
        target.takeDamage?.(this.projectileDamage);
        this.attachBoss(target,p.x,p.y);
      }else if(p.life>0){
        const h=this.surfaceHit(p,world);
        if(h)this.attachSurface(h.x,h.y);
      }

      if(this.projectile&&(
        p.life<=0||p.x<-120||p.x>world.width+120||
        p.y<-120||p.y>world.floorY+180
      )) this.projectile=null;
    }

    const a=this.anchorPosition();
    if(a&&a.mode==='boss'){
      if(!a.target||a.target.dead){
        this.anchor=null;
      }else{
        const t=this.tension(player);
        if(t.excess>0){
          const dps=Math.min(
            this.tetherMaxDps,
            this.tetherBaseDps+t.excess*this.tetherStretchDps
          );
          a.target.takeDamage?.(dps*dt);
        }

        if(t.distance>=this.tetherSnapDistance){
          a.target.takeDamage?.(this.snapBaseDamage+t.ratio*12);
          this.anchor=null;
          this.reelTimer=0;
        }
      }
    }

    if(this.reelTimer>0&&this.anchor){
      const pos=this.anchorPosition();
      const dx=pos.x-player.x,dy=pos.y-player.y;
      const d=Math.max(1,Math.hypot(dx,dy));
      const pull=this.anchor.mode==='surface'?2500:1500;
      player.vx+=dx/d*pull*dt;
      player.vy+=dy/d*pull*dt;
    }
  }

  getSpriteEntry(angleRadians=0,centered=false){
    return centered
      ? this.sprite.getCenteredEntry(angleRadians)
      : this.sprite.getEntry(angleRadians);
  }

  draw(ctx,player,pointerWorld,cameraX,artPixelSize,active=true){
    const a=this.anchorPosition();

    if(a){
      const t=this.tension(player);
      ctx.save();
      ctx.globalAlpha=.5+.45*t.ratio;
      ctx.strokeStyle=t.ratio>.7?'#ff6b6b':'#d7dbe2';
      ctx.lineWidth=2+3*t.ratio;
      ctx.beginPath();
      ctx.moveTo(player.x-cameraX,player.y);
      ctx.lineTo(a.x-cameraX,a.y);
      ctx.stroke();

      const size=12;
      ctx.fillStyle='#e46f6f';
      ctx.fillRect(
        Math.round(a.x-cameraX-size/2),
        Math.round(a.y-size/2),
        size,size
      );
      ctx.restore();
    }

    if(this.projectile){
      const p=this.projectile;
      ctx.save();
      ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);
      ctx.fillStyle='#e46f6f';
      ctx.fillRect(Math.round(p.x-cameraX-5),Math.round(p.y-3),10,6);
      ctx.restore();
    }

    if(!active)return;
    const aim=this.getAim(player,pointerWorld);
    this.sprite.draw(ctx,aim.x-cameraX,aim.y,aim.angle,artPixelSize,{
      glowStrength:this.reelTimer>0?1.35:1,
    });
  }
}
