import {
  WeaponSpriteRenderer,
} from './WeaponSpriteRenderer.js?v=60';

const KEPLER_SPRITE_ASSET = {"version":2,"name":"kepler","displayName":"kepler","type":"weapon","scale":1,"pivot":[0,0],"parts":[{"id":"polygon-1","name":"polygon-1","type":"polygon","material":"glow-white","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[6,0],[6,-1],[7,-2],[9,-2],[10,-1],[10,0],[12,0],[12,-2],[10,-4],[6,-4],[4,-2],[4,0]]},{"id":"polygon-mirror-2","name":"polygon-1 mirror","type":"polygon","material":"glow-white","groupId":null,"x":0,"y":0,"rotation":0,"outline":null,"points":[[4,0],[4,2],[6,4],[10,4],[12,2],[12,0],[10,0],[10,1],[9,2],[7,2],[6,1],[6,0]]}],"groups":[],"hitboxes":[],"animations":{"clips":{"idle":{"name":"idle","duration":1,"loop":true,"tracks":[]},"fire":{"name":"fire","duration":0.25,"loop":false,"tracks":[]},"special":{"name":"special","duration":0.6,"loop":false,"tracks":[]}}},"markers":{"muzzle":{"x":8,"y":0,"rotation":0}},"render":{"mergeOutlines":true,"outline":{"enabled":true,"color":"#35383e","thickness":1},"padding":2}};

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

export class KeplerWeapon {
  constructor(){
    this.name='Kepler';
    this.orbitRadius=43;

    this.maxOrbiters=6;
    this.orbiterRadius=62;
    this.orbiterRadiusStep=5;
    this.orbiterAngularSpeed=2.15;
    this.orbiterSize=10;

    this.damage=9;
    this.specialDamageMultiplier=1.35;
    this.bulletSpeed=860;
    this.bulletLife=2.7;

    this.fireCooldown=.28;
    this.fireTimer=0;

    this.specialCooldown=10;
    this.specialCooldownTimer=this.specialCooldown;

    this.visualTime=0;
    this.orbitPhase=0;
    this.orbiters=[];
    this.bullets=[];
    this.nextOrbiterId=1;
    this.shotSerial=0;

    this.sprite=new WeaponSpriteRenderer(KEPLER_SPRITE_ASSET);
  }

  reset(){
    this.fireTimer=0;
    this.specialCooldownTimer=this.specialCooldown;
    this.visualTime=0;
    this.orbitPhase=0;
    this.orbiters.length=0;
    this.bullets.length=0;
    this.nextOrbiterId=1;
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

  findFreeOrbitSlot(){
    const occupied=
      new Set(
        this.orbiters.map(
          orbiter=>orbiter.slot,
        ),
      );

    for(
      let slot=0;
      slot<this.maxOrbiters;
      slot++
    ){
      if(!occupied.has(slot)){
        return slot;
      }
    }

    return null;
  }

  addOrbiter(){
    const slot=
      this.findFreeOrbitSlot();

    if(slot===null){
      return false;
    }

    this.orbiters.push({
      id:this.nextOrbiterId++,
      slot,
      age:0,
    });

    this.shotSerial++;
    return true;
  }

  orbiterPosition(player,orbiter){
    const slot=
      orbiter.slot??0;

    const angle=
      this.orbitPhase+
      slot*(
        Math.PI*2/
        Math.max(
          1,
          this.maxOrbiters,
        )
      );

    const radius=
      this.orbiterRadius+
      (slot%2)*
      this.orbiterRadiusStep;

    return {
      x:
        player.x+
        Math.cos(angle)*
        radius,
      y:
        player.y+
        Math.sin(angle)*
        radius,
    };
  }

  releaseOrbiter(player,pointerWorld,index=0,special=false){
    if(this.orbiters.length===0)return false;

    const orbiter=
      this.orbiters[index];

    if(!orbiter)return false;

    const pos=
      this.orbiterPosition(
        player,
        orbiter,
      );

    this.orbiters.splice(
      index,
      1,
    );
    const angle=Math.atan2(pointerWorld.y-pos.y,pointerWorld.x-pos.x);

    this.bullets.push({
      x:pos.x,y:pos.y,
      vx:Math.cos(angle)*this.bulletSpeed,
      vy:Math.sin(angle)*this.bulletSpeed,
      life:this.bulletLife,
      maxLife:this.bulletLife,
      damage:this.damage*(special?this.specialDamageMultiplier:1),
      special,
    });

    this.shotSerial++;
    return true;
  }

  triggerSpecial({player,pointerWorld}={}){
    if(
      this.specialCooldownTimer>0||
      this.orbiters.length===0||
      !player||
      !pointerWorld
    ) return false;

    this.specialCooldownTimer=this.specialCooldown;

    const count=this.orbiters.length;
    for(let i=count-1;i>=0;i--){
      this.releaseOrbiter(player,pointerWorld,i,true);
    }
    return true;
  }

  get specialAbilities(){
    return [{
      id:'kepler-release',
      name:'orbital release',
      cooldown:this.specialCooldown,
      remaining:this.specialCooldownTimer,
      active:false,
    }];
  }

  update(dt,player,pointerWorld,firing,world,target,active=true){
    this.fireTimer=Math.max(0,this.fireTimer-dt);
    if(active)this.specialCooldownTimer=Math.max(0,this.specialCooldownTimer-dt);
    this.visualTime+=dt;
    this.orbitPhase=
      (
        this.orbitPhase+
        this.orbiterAngularSpeed*
        dt
      )%
      (Math.PI*2);

    for(const orbiter of this.orbiters){
      orbiter.age+=dt;
    }

    if(active&&firing&&this.fireTimer<=0){
      if(this.orbiters.length<this.maxOrbiters){
        this.addOrbiter();
      }else{
        this.releaseOrbiter(player,pointerWorld,0,false);
      }
      this.fireTimer=this.fireCooldown;
    }

    for(const bullet of this.bullets){
      bullet.x+=bullet.vx*dt;
      bullet.y+=bullet.vy*dt;
      bullet.life-=dt;

      if(bullet.life<=0)continue;

      const hitProjectile=target?.damageProjectileAt?.(
        bullet.x,bullet.y,this.orbiterSize*.5,bullet.damage
      );

      if(hitProjectile){
        bullet.life=0;
        continue;
      }

      if(
        target&&!target.dead&&
        target.hitTest?.(bullet.x,bullet.y,this.orbiterSize*.5)
      ){
        target.takeDamage?.(bullet.damage);
        bullet.life=0;
      }
    }

    this.bullets=this.bullets.filter(
      b=>b.life>0&&b.x>-120&&b.x<world.width+120&&
      b.y>-120&&b.y<world.floorY+180
    );
  }

  getSpriteEntry(angleRadians=0,centered=false){
    return centered
      ? this.sprite.getCenteredEntry(angleRadians)
      : this.sprite.getEntry(angleRadians);
  }

  draw(ctx,player,pointerWorld,cameraX,artPixelSize,active=true){
    ctx.save();

    for(let i=0;i<this.orbiters.length;i++){
      const orbiter=this.orbiters[i];
      const pos=
        this.orbiterPosition(
          player,
          orbiter,
        );

      const pulse=
        .82+
        .18*
        Math.sin(
          orbiter.age*7+
          orbiter.slot,
        );

      ctx.globalAlpha=.8*pulse;
      ctx.fillStyle='#f1f2f4';
      ctx.shadowColor='#ffffff';
      ctx.shadowBlur=8;
      ctx.fillRect(
        Math.round(pos.x-cameraX-this.orbiterSize/2),
        Math.round(pos.y-this.orbiterSize/2),
        this.orbiterSize,
        this.orbiterSize
      );
    }

    for(const bullet of this.bullets){
      const fade=clamp(bullet.life/bullet.maxLife,0,1);
      ctx.globalAlpha=fade;
      ctx.fillStyle='#ffffff';
      ctx.shadowColor=bullet.special?'#ffffff':'transparent';
      ctx.shadowBlur=bullet.special?12:0;
      ctx.fillRect(
        Math.round(bullet.x-cameraX-this.orbiterSize/2),
        Math.round(bullet.y-this.orbiterSize/2),
        this.orbiterSize,
        this.orbiterSize
      );
    }

    ctx.restore();

    if(!active)return;

    const aim=this.getAim(player,pointerWorld);
    this.sprite.draw(
      ctx,
      aim.x-cameraX,
      aim.y,
      aim.angle,
      artPixelSize,
      {
        glowStrength:
          1+
          .08*this.orbiters.length,
      },
    );
  }
}
