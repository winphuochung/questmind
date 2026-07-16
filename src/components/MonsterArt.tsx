import React, { useEffect, useRef } from "react";
import p5 from "p5";

interface MonsterArtProps {
  seed: string;
  isBoss: boolean;
  hpPercentage: number; // 0 to 1
  attackTrigger: boolean;
}

export default function MonsterArt({ seed, isBoss, hpPercentage, attackTrigger }: MonsterArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // We generate a numeric seed from the string
    let numericSeed = 0;
    for (let i = 0; i < seed.length; i++) {
      numericSeed += seed.charCodeAt(i);
    }

    const sketch = (p: p5) => {
      let particles: Particle[] = [];
      let noiseScale = 0.01;
      let time = 0;
      let isAttacking = false;
      let hp = 1;

      class Particle {
        pos: p5.Vector;
        vel: p5.Vector;
        acc: p5.Vector;
        maxSpeed: number;
        color: p5.Color;
        size: number;
        angle: number;

        constructor() {
          this.pos = p.createVector(p.random(p.width), p.random(p.height));
          this.vel = p.createVector(0, 0);
          this.acc = p.createVector(0, 0);
          this.maxSpeed = isBoss ? p.random(2, 5) : p.random(1, 3);
          this.size = isBoss ? p.random(3, 8) : p.random(2, 5);
          this.angle = 0;
          
          if (isBoss) {
            this.color = p.color(p.random(200, 255), p.random(50, 100), p.random(50, 150), 150);
          } else {
            this.color = p.color(p.random(50, 100), p.random(200, 255), p.random(150, 255), 150);
          }
        }

        update(isAttackingParam: boolean, currentHp: number) {
          // Flow field behavior based on perlin noise
          let n = p.noise(this.pos.x * noiseScale, this.pos.y * noiseScale, time);
          this.angle = n * p.TWO_PI * 4;
          
          let force = p5.Vector.fromAngle(this.angle);
          
          if (isAttackingParam) {
            force.mult(5); // Surge when attacking
            this.maxSpeed = 10;
          } else {
            // Speed decreases with HP
            let speedMod = p.map(currentHp, 0, 1, 0.2, 1);
            force.mult(speedMod);
            this.maxSpeed = isBoss ? p.random(2, 5) * speedMod : p.random(1, 3) * speedMod;
          }

          this.acc.add(force);
          this.vel.add(this.acc);
          this.vel.limit(this.maxSpeed);
          this.pos.add(this.vel);
          this.acc.mult(0);

          // Wrap around edges
          if (this.pos.x > p.width) this.pos.x = 0;
          if (this.pos.x < 0) this.pos.x = p.width;
          if (this.pos.y > p.height) this.pos.y = 0;
          if (this.pos.y < 0) this.pos.y = p.height;
        }

        display() {
          p.noStroke();
          p.fill(this.color);
          p.circle(this.pos.x, this.pos.y, this.size);
        }
      }

      p.setup = () => {
        p.createCanvas(300, 300);
        p.randomSeed(numericSeed);
        p.noiseSeed(numericSeed);
        
        let numParticles = isBoss ? 300 : 150;
        for (let i = 0; i < numParticles; i++) {
          particles.push(new Particle());
        }
      };

      p.draw = () => {
        // Clear background with high alpha for trailing effect
        p.background(15, 23, 42, 40); // slate-900 with alpha

        // Draw organic aura behind
        p.noStroke();
        let auraAlpha = p.map(hp, 0, 1, 10, 50);
        let auraSize = p.map(p.sin(time * 2), -1, 1, 150, 200);
        
        if (isAttacking) {
           p.fill(225, 29, 72, auraAlpha * 2); // rose-600
           auraSize += 50;
        } else if (isBoss) {
           p.fill(159, 18, 57, auraAlpha); // rose-800
        } else {
           p.fill(12, 74, 110, auraAlpha); // sky-900
        }
        
        p.circle(p.width / 2, p.height / 2, auraSize);

        // Update and draw particles
        for (let pt of particles) {
          pt.update(isAttacking, hp);
          pt.display();
        }

        time += 0.005;
      };

      // External methods to update state
      p.updateState = (newHp: number, newAttacking: boolean) => {
        hp = newHp;
        isAttacking = newAttacking;
      };
    };

    p5Instance.current = new p5(sketch, containerRef.current);

    return () => {
      p5Instance.current?.remove();
    };
  }, [seed, isBoss]); // Re-create sketch if seed or isBoss changes

  // Update existing sketch state without re-creating
  useEffect(() => {
    if (p5Instance.current) {
      // @ts-ignore
      if (typeof p5Instance.current.updateState === 'function') {
        // @ts-ignore
        p5Instance.current.updateState(hpPercentage, attackTrigger);
      }
    }
  }, [hpPercentage, attackTrigger]);

  return (
    <div className="absolute inset-0 z-0 opacity-80 flex items-center justify-center pointer-events-none mix-blend-screen overflow-hidden rounded-3xl" ref={containerRef} />
  );
}
