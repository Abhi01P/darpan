"use client"

import { useEffect, useRef } from "react"

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    // Parallax & Anti-gravity Particle properties
    const particles: {
      x: number
      y: number
      radius: number
      speedY: number
      speedX: number
      opacity: number
      depth: number // Values between 0.1 (far background) and 1 (close foreground)
    }[] = []

    let targetMouseX = 0
    let targetMouseY = 0
    let mouseX = 0
    let mouseY = 0

    const initParticles = () => {
      particles.length = 0
      // High density for an immersive, premium "dust" feel
      const count = Math.floor((canvas.width * canvas.height) / 3000)

      for (let i = 0; i < count; i++) {
        const depth = Math.random() // Distribute randomly in Z-axis
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Closer particles are slightly larger
          radius: depth * 1.5 + 0.5,
          // "Anti-gravity" effect: float upwards, closer particles move faster
          speedY: -(depth * 0.4 + 0.15),
          // Gentle horizontal drift
          speedX: (Math.random() - 0.5) * 0.1,
          opacity: depth * 0.6 + 0.1, // Closer particles are brighter
          depth
        })
      }
    }

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
      } else {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
      initParticles()
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Get mouse position relative to center of screen for parallax
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05
    }

    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)

    resizeCanvas()

    const draw = () => {
      // Clear canvas completely each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Smooth interpolation for mouse movement (Parallax easing)
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      particles.forEach((p) => {
        // Natural upward anti-gravity drift
        p.y += p.speedY
        p.x += p.speedX

        // Loop particles around when they float off the top
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }
        // Wrap horizontally
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        // Apply 3D Parallax shift based on depth
        // Particles closer to the camera (higher depth) move more intensely with the mouse
        const drawX = p.x - mouseX * p.depth * 10
        const drawY = p.y - mouseY * p.depth * 10

        ctx.beginPath()
        ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2)
        // Bright blue color for dots matching theme primary
        ctx.fillStyle = `hsla(217, 91%, 60%, ${p.opacity})`

        // Add subtle glow to the foreground particles to emphasize depth
        if (p.depth > 0.8) {
          ctx.shadowBlur = 4
          ctx.shadowColor = 'hsla(217, 91%, 60%, 0.4)'
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    // Use theme background
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
      {/* Soft gradient edge fade designed for light mode interfaces */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)"
        }}
      />
    </div>
  )
}
