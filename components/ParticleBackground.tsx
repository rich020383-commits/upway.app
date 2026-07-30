"use client";

import { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 1. CLASE ESTRELLA (Fondo titilante)
    class Star {
      x: number; y: number; radius: number; alpha: number; alphaChange: number;
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.radius = Math.random() * 1.2;
        this.alpha = Math.random();
        this.alphaChange = (Math.random() * 0.01) + 0.003;
      }
      draw() {
        this.alpha += this.alphaChange;
        if (this.alpha >= 1 || this.alpha <= 0.1) this.alphaChange = -this.alphaChange;
        ctx!.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // 2. CLASE NODO IA (Conexiones interactivas)
    class Node {
      x: number; y: number; size: number; speedX: number; speedY: number;
      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
      }
      update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.x > canvas!.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas!.height || this.y < 0) this.speedY = -this.speedY;
      }
      draw() {
        ctx!.fillStyle = "rgba(59, 130, 246, 0.8)"; 
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    let starsArray: Star[] = [];
    let nodesArray: Node[] = [];

    const init = () => {
      starsArray = [];
      nodesArray = [];
      for (let i = 0; i < 120; i++) starsArray.push(new Star());
      for (let i = 0; i < 70; i++) nodesArray.push(new Node());
    };

    const animate = () => {
      // 🔥 CORRECCIÓN MAESTRA: Limpiamos la pantalla de forma transparente en vez de pintar un bloque negro
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
      
      // Dibujar estrellas de fondo
      starsArray.forEach(star => star.draw());

      // Dibujar y conectar Nodos IA
      for (let i = 0; i < nodesArray.length; i++) {
        nodesArray[i].update();
        nodesArray[i].draw();
        
        for (let j = i; j < nodesArray.length; j++) {
          const dx = nodesArray[i].x - nodesArray[j].x;
          const dy = nodesArray[i].y - nodesArray[j].y;
          const distance = dx * dx + dy * dy;
          
          if (distance < 25000) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.25 - distance / 125000})`; 
            ctx.lineWidth = 0.7;
            ctx.moveTo(nodesArray[i].x, nodesArray[i].y);
            ctx.lineTo(nodesArray[j].x, nodesArray[j].y);
            ctx.stroke();
          }
        }

        // Interacción con el mouse (Conexión por proximidad global)
        const dxMouse = nodesArray[i].x - mouse.x;
        const dyMouse = nodesArray[i].y - mouse.y;
        if (dxMouse * dxMouse + dyMouse * dyMouse < 40000) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(96, 165, 250, 0.4)`;
          ctx.lineWidth = 1;
          ctx.moveTo(nodesArray[i].x, nodesArray[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}