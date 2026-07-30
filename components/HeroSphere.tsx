"use client";

import { useEffect, useRef } from "react";

export default function HeroSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const particles: any[] = [];
    const particleCount = 400; // Densidad de la red neuronal
    const sphereRadius = width < 768 ? 150 : 250;
    
    // Generar puntos en una esfera 3D usando coordenadas esféricas
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      particles.push({
        x: sphereRadius * Math.cos(theta) * Math.sin(phi),
        y: sphereRadius * Math.sin(theta) * Math.sin(phi),
        z: sphereRadius * Math.cos(phi),
        baseX: sphereRadius * Math.cos(theta) * Math.sin(phi),
        baseY: sphereRadius * Math.sin(theta) * Math.sin(phi),
        baseZ: sphereRadius * Math.cos(phi),
      });
    }

    let angleX = 0;
    let angleY = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Rotación constante y elegante
      angleX += 0.001;
      angleY += 0.002;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      particles.forEach((p, i) => {
        // Rotación 3D
        let y1 = p.baseY * cosX - p.baseZ * sinX;
        let z1 = p.baseY * sinX + p.baseZ * cosX;
        let x2 = p.baseX * cosY + z1 * sinY;
        let z2 = -p.baseX * sinY + z1 * cosY;

        // Perspectiva 2D
        const fov = 400;
        const scale = fov / (fov + z2);
        const x2d = (width / 2) + x2 * scale;
        const y2d = (height / 2) + y1 * scale;

        p.currentX = x2d;
        p.currentY = y2d;
        p.scale = scale;

        // Dibujar nodos (Brillo azul si están al frente)
        const alpha = Math.max(0.1, scale - 0.5);
        ctx.beginPath();
        ctx.arc(x2d, y2d, 1.5 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${alpha})`; // Azul #2563EB
        ctx.shadowBlur = z2 < 0 ? 15 : 0; // Efecto Glow en el frente
        ctx.shadowColor = "#3B82F6";
        ctx.fill();
      });

      // Conexiones neuronales entre nodos cercanos
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].currentX - particles[j].currentX;
          const dy = particles[i].currentY - particles[j].currentY;
          const dist = dx * dx + dy * dy;

          if (dist < 1500 && particles[i].scale > 0.8) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(96, 165, 250, ${0.15 - dist / 10000})`; // Azul claro #60A5FA
            ctx.moveTo(particles[i].currentX, particles[i].currentY);
            ctx.lineTo(particles[j].currentX, particles[j].currentY);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };
    
    animate();

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full opacity-80" />;
}