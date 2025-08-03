import React, { useState, useEffect } from 'react';
import useWindowSize from '../hooks/useWindowSize';

// A lightweight, dependency-free confetti particle component
const Particle = ({ x, y, angle, speed, opacity, color }: { x: number, y: number, angle: number, speed: number, opacity: number, color: string }) => {
  const style = {
    position: 'absolute' as 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: '10px',
    height: '10px',
    backgroundColor: color,
    opacity: opacity,
    transform: `rotate(${angle}deg)`,
    transition: `transform 1s linear, top 1s linear, opacity 1s linear`,
  };

  const [finalStyle, setFinalStyle] = useState({});

  useEffect(() => {
    const finalX = x + Math.cos(angle * Math.PI / 180) * speed;
    const finalY = y + Math.sin(angle * Math.PI / 180) * speed + (speed * 1.5); // Add gravity

    setFinalStyle({
      transform: `rotate(${angle + 360}deg) translate(0, 0)`,
      top: `${finalY}px`,
      opacity: 0,
    });
  }, [angle, speed, x, y]);

  return <div style={{ ...style, ...finalStyle }} />;
};

const ConfettiEffect: React.FC<{ launch: boolean }> = ({ launch }) => {
  const { width, height } = useWindowSize();
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    if (launch) {
      const newParticles = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: width / 2,
        y: height / 2,
        angle: Math.random() * 360,
        speed: Math.random() * 300 + 100,
        color: ['#0ea5e9', '#7dd3fc', '#e2e8f0', '#94a3b8'][Math.floor(Math.random() * 4)],
        opacity: 1,
      }));
      setParticles(newParticles);
    }
  }, [launch, width, height]);

  if (!launch || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => <Particle key={p.id} {...p} />)}
    </div>
  );
};

export default React.memo(ConfettiEffect);