import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface TutorAvatarProps {
  isSpeaking: boolean;
  volume: number;
  isThinking: boolean;
}

export default function TutorAvatar({ isSpeaking, volume, isThinking }: TutorAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const nextBlinkRef = useRef(2 + Math.random() * 3);
  const blinkProgressRef = useRef(-1);
  const gazeTargetRef = useRef({ x: 0, y: 0 });
  const gazeCurrentRef = useRef({ x: 0, y: 0 });
  const gazeTimerRef = useRef(0);
  const headTiltRef = useRef(0);
  const headTiltTargetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const W = 600;
    const H = 600;
    canvas.width = W;
    canvas.height = H;

    const CX = W / 2;
    const CY = 260;

    function ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    }

    function softShadow(x: number, y: number, rx: number, ry: number, color: string, blur: number) {
      ctx.save();
      ctx.filter = `blur(${blur}px)`;
      ctx.fillStyle = color;
      ellipse(x, y, rx, ry);
      ctx.fill();
      ctx.restore();
    }

    const draw = () => {
      const dt = 0.016;
      timeRef.current += dt;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      // -- Blink logic: natural irregular blinking --
      blinkTimerRef.current += dt;
      if (blinkTimerRef.current >= nextBlinkRef.current) {
        blinkProgressRef.current = 0;
        blinkTimerRef.current = 0;
        nextBlinkRef.current = 2.5 + Math.random() * 4;
      }
      let eyeOpenness = 1;
      if (blinkProgressRef.current >= 0) {
        blinkProgressRef.current += dt;
        const bp = blinkProgressRef.current;
        if (bp < 0.06) eyeOpenness = 1 - bp / 0.06;
        else if (bp < 0.12) eyeOpenness = 0;
        else if (bp < 0.2) eyeOpenness = (bp - 0.12) / 0.08;
        else { eyeOpenness = 1; blinkProgressRef.current = -1; }
      }

      // -- Gaze: smooth saccade-like eye movement --
      gazeTimerRef.current += dt;
      if (gazeTimerRef.current > 1.5 + Math.random() * 3) {
        gazeTimerRef.current = 0;
        gazeTargetRef.current = {
          x: (Math.random() - 0.5) * 5,
          y: (Math.random() - 0.5) * 3,
        };
      }
      gazeCurrentRef.current.x += (gazeTargetRef.current.x - gazeCurrentRef.current.x) * 0.08;
      gazeCurrentRef.current.y += (gazeTargetRef.current.y - gazeCurrentRef.current.y) * 0.08;
      const gx = gazeCurrentRef.current.x;
      const gy = gazeCurrentRef.current.y;

      // -- Head micro-movement --
      if (Math.random() < 0.005) {
        headTiltTargetRef.current = (Math.random() - 0.5) * 0.04;
      }
      headTiltRef.current += (headTiltTargetRef.current - headTiltRef.current) * 0.02;
      const breathe = Math.sin(t * 1.2) * 2.5;
      const headNod = isSpeaking ? Math.sin(t * 2.5) * 1.5 : Math.sin(t * 0.6) * 0.8;

      ctx.save();
      ctx.translate(CX, CY + breathe);
      ctx.rotate(headTiltRef.current);

      // ====== BODY / SHOULDERS ======
      const shoulderGrad = ctx.createLinearGradient(-160, 100, 160, 220);
      shoulderGrad.addColorStop(0, '#3d3575');
      shoulderGrad.addColorStop(0.5, '#2e2660');
      shoulderGrad.addColorStop(1, '#1e1845');
      ctx.fillStyle = shoulderGrad;
      ctx.beginPath();
      ctx.moveTo(-140, 220);
      ctx.quadraticCurveTo(-145, 140, -80, 108);
      ctx.quadraticCurveTo(-30, 90, 0, 88);
      ctx.quadraticCurveTo(30, 90, 80, 108);
      ctx.quadraticCurveTo(145, 140, 140, 220);
      ctx.closePath();
      ctx.fill();

      // Collar / neckline
      ctx.strokeStyle = '#4a4090';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-35, 92);
      ctx.quadraticCurveTo(0, 105, 35, 92);
      ctx.stroke();

      // ====== NECK ======
      const neckGrad = ctx.createLinearGradient(-20, 55, 20, 90);
      neckGrad.addColorStop(0, '#e6b69a');
      neckGrad.addColorStop(1, '#d4a088');
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.moveTo(-22, 58);
      ctx.quadraticCurveTo(-24, 75, -22, 92);
      ctx.lineTo(22, 92);
      ctx.quadraticCurveTo(24, 75, 22, 58);
      ctx.closePath();
      ctx.fill();

      // Neck shadow
      softShadow(0, 85, 30, 8, 'rgba(160, 100, 70, 0.15)', 6);

      // ====== HEAD ======
      ctx.save();
      ctx.translate(0, headNod);

      // Head shadow on neck
      softShadow(0, 60, 55, 12, 'rgba(140, 90, 60, 0.12)', 8);

      // Head shape
      const headGrad = ctx.createRadialGradient(-15, -25, 10, 5, -5, 95);
      headGrad.addColorStop(0, '#f5d4bb');
      headGrad.addColorStop(0.4, '#f0c9af');
      headGrad.addColorStop(0.7, '#e8b89d');
      headGrad.addColorStop(1, '#dca98a');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.moveTo(-58, -20);
      ctx.quadraticCurveTo(-68, -50, -60, -75);
      ctx.quadraticCurveTo(-45, -105, 0, -110);
      ctx.quadraticCurveTo(45, -105, 60, -75);
      ctx.quadraticCurveTo(68, -50, 58, -20);
      // Jawline
      ctx.quadraticCurveTo(55, 15, 40, 35);
      ctx.quadraticCurveTo(22, 52, 0, 58);
      ctx.quadraticCurveTo(-22, 52, -40, 35);
      ctx.quadraticCurveTo(-55, 15, -58, -20);
      ctx.closePath();
      ctx.fill();

      // Subtle face contour shadows
      softShadow(-48, 5, 15, 30, 'rgba(180, 120, 90, 0.08)', 10);
      softShadow(48, 5, 15, 30, 'rgba(180, 120, 90, 0.08)', 10);
      softShadow(0, 48, 25, 10, 'rgba(180, 120, 90, 0.06)', 8);

      // ====== EARS ======
      [[-62, -15, -0.15], [62, -15, 0.15]].forEach(([ex, ey, rot]) => {
        ctx.fillStyle = '#e6b69a';
        ellipse(ex, ey, 11, 18, rot);
        ctx.fill();
        ctx.fillStyle = '#dca98a';
        ellipse(ex + (ex < 0 ? 2 : -2), ey, 7, 12, rot);
        ctx.fill();
      });

      // ====== HAIR ======
      const hairGrad = ctx.createLinearGradient(-70, -120, 70, -30);
      hairGrad.addColorStop(0, '#2a1a0e');
      hairGrad.addColorStop(0.3, '#3d2914');
      hairGrad.addColorStop(0.7, '#4a3420');
      hairGrad.addColorStop(1, '#3d2914');

      ctx.fillStyle = hairGrad;
      ctx.beginPath();
      ctx.moveTo(-62, -30);
      ctx.quadraticCurveTo(-72, -60, -62, -85);
      ctx.quadraticCurveTo(-48, -118, 0, -125);
      ctx.quadraticCurveTo(48, -118, 62, -85);
      ctx.quadraticCurveTo(72, -60, 62, -30);
      ctx.quadraticCurveTo(58, -55, 50, -65);
      ctx.quadraticCurveTo(25, -80, 0, -78);
      ctx.quadraticCurveTo(-25, -80, -50, -65);
      ctx.quadraticCurveTo(-58, -55, -62, -30);
      ctx.closePath();
      ctx.fill();

      // Hair highlight
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.ellipse(-20, -100, 30, 12, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Side hair
      ctx.fillStyle = '#2a1a0e';
      ctx.beginPath();
      ctx.moveTo(-62, -30);
      ctx.quadraticCurveTo(-68, -5, -60, 5);
      ctx.quadraticCurveTo(-55, -10, -58, -30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(62, -30);
      ctx.quadraticCurveTo(68, -5, 60, 5);
      ctx.quadraticCurveTo(55, -10, 58, -30);
      ctx.closePath();
      ctx.fill();

      // ====== EYEBROWS ======
      const browRaise = isThinking ? -4 : isSpeaking ? Math.sin(t * 3) * 1 : 0;
      [[-25, -48 + browRaise], [25, -48 + browRaise]].forEach(([bx, by], i) => {
        ctx.strokeStyle = '#3d2914';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const dir = i === 0 ? 1 : -1;
        ctx.moveTo(bx - 16 * dir, by + 3);
        ctx.quadraticCurveTo(bx, by - 5, bx + 16 * dir, by + 1);
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(bx - 14 * dir, by + 4);
        ctx.quadraticCurveTo(bx, by - 3, bx + 14 * dir, by + 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // ====== EYES ======
      const eyeY = -30;
      [[-25, eyeY], [25, eyeY]].forEach(([ex, ey]) => {
        // Eye socket shadow
        softShadow(ex, ey - 2, 18, 10, 'rgba(160, 110, 80, 0.1)', 6);

        // Sclera (eye white)
        const scleraH = 9 * eyeOpenness;
        if (scleraH > 0.5) {
          ctx.fillStyle = '#f8f6f2';
          ellipse(ex, ey, 14, scleraH);
          ctx.fill();

          // Slight shadow on top of sclera (upper lid)
          ctx.save();
          ctx.clip();
          softShadow(ex, ey - scleraH * 0.5, 14, 4, 'rgba(100, 70, 50, 0.1)', 3);
          ctx.restore();

          // Iris
          const irisR = 7;
          const irisGrad = ctx.createRadialGradient(
            ex + gx + 0.5, ey + gy - 0.5, 1,
            ex + gx, ey + gy, irisR
          );
          irisGrad.addColorStop(0, '#6b8f5e');
          irisGrad.addColorStop(0.3, '#4a7a3f');
          irisGrad.addColorStop(0.7, '#3a6030');
          irisGrad.addColorStop(0.85, '#2d4a25');
          irisGrad.addColorStop(1, '#1e3318');
          ctx.fillStyle = irisGrad;
          ellipse(ex + gx, ey + gy, irisR, Math.min(irisR, scleraH * 0.9));
          ctx.fill();

          // Limbal ring
          ctx.strokeStyle = 'rgba(30, 50, 20, 0.4)';
          ctx.lineWidth = 0.8;
          ellipse(ex + gx, ey + gy, irisR, Math.min(irisR, scleraH * 0.9));
          ctx.stroke();

          // Pupil
          const pupilR = 3.2;
          ctx.fillStyle = '#0a0a0a';
          ellipse(ex + gx, ey + gy, pupilR, Math.min(pupilR, scleraH * 0.45));
          ctx.fill();

          // Catchlight (main)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ellipse(ex + gx + 2.5, ey + gy - 2.5, 2.2, Math.min(2.2, scleraH * 0.3));
          ctx.fill();

          // Catchlight (secondary)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ellipse(ex + gx - 1.5, ey + gy + 1.5, 1, Math.min(1, scleraH * 0.15));
          ctx.fill();
        }

        // Eyelids (upper)
        ctx.strokeStyle = '#c49a7c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ex - 15, ey);
        ctx.quadraticCurveTo(ex, ey - 11 * eyeOpenness, ex + 15, ey);
        ctx.stroke();

        // Lower lash line
        ctx.strokeStyle = 'rgba(100, 70, 50, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(ex - 13, ey + 1);
        ctx.quadraticCurveTo(ex, ey + 8 * eyeOpenness, ex + 13, ey + 1);
        ctx.stroke();

        // Eyelashes (upper)
        if (eyeOpenness > 0.5) {
          ctx.strokeStyle = '#2a1a0e';
          ctx.lineWidth = 1.2;
          for (let i = 0; i < 5; i++) {
            const lx = ex - 10 + i * 5;
            const curve = Math.sin((i / 4) * Math.PI) * 3;
            ctx.beginPath();
            ctx.moveTo(lx, ey - 8 * eyeOpenness + Math.abs(i - 2) * 1.5);
            ctx.lineTo(lx + (i < 2.5 ? -0.5 : 0.5), ey - 11 * eyeOpenness - curve);
            ctx.stroke();
          }
        }
      });

      // ====== NOSE ======
      // Bridge shadow
      softShadow(-3, -15, 6, 20, 'rgba(170, 115, 80, 0.06)', 5);

      // Nose shape
      ctx.strokeStyle = '#d4a088';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-1, -12);
      ctx.quadraticCurveTo(1, 5, 0, 12);
      ctx.quadraticCurveTo(-4, 17, -8, 16);
      ctx.stroke();

      // Nose tip highlight
      ctx.fillStyle = 'rgba(255, 230, 210, 0.2)';
      ellipse(0, 12, 5, 4);
      ctx.fill();

      // Nostrils
      ctx.fillStyle = 'rgba(170, 110, 80, 0.25)';
      ellipse(-7, 15, 4, 2.5, -0.2);
      ctx.fill();
      ellipse(7, 15, 4, 2.5, 0.2);
      ctx.fill();

      // Nose shadow underneath
      softShadow(0, 20, 12, 4, 'rgba(170, 115, 80, 0.08)', 4);

      // ====== MOUTH / LIPS ======
      const mouthY = 32;
      const mouthOpen = isSpeaking ? Math.max(2, volume * 18) : 0;
      const smileCorner = isSpeaking ? 1 : 3;

      if (mouthOpen > 1) {
        // Open mouth interior
        const mouthGrad = ctx.createRadialGradient(0, mouthY + 2, 1, 0, mouthY + 2, mouthOpen + 3);
        mouthGrad.addColorStop(0, '#3d1515');
        mouthGrad.addColorStop(0.6, '#5c2020');
        mouthGrad.addColorStop(1, '#7a3030');
        ctx.fillStyle = mouthGrad;
        ctx.beginPath();
        ctx.moveTo(-14, mouthY);
        ctx.quadraticCurveTo(0, mouthY - mouthOpen * 0.3, 14, mouthY);
        ctx.quadraticCurveTo(0, mouthY + mouthOpen * 1.2, -14, mouthY);
        ctx.closePath();
        ctx.fill();

        // Teeth
        if (mouthOpen > 4) {
          ctx.fillStyle = 'rgba(250, 248, 245, 0.85)';
          ctx.beginPath();
          const teethW = Math.min(12, mouthOpen * 0.8);
          ctx.roundRect(-teethW, mouthY - mouthOpen * 0.15, teethW * 2, mouthOpen * 0.35, 1);
          ctx.fill();
        }

        // Tongue hint for wide open
        if (mouthOpen > 8) {
          ctx.fillStyle = '#b85555';
          ellipse(0, mouthY + mouthOpen * 0.5, 7, 4);
          ctx.fill();
        }
      }

      // Upper lip
      ctx.fillStyle = '#c8887a';
      ctx.beginPath();
      ctx.moveTo(-16, mouthY - Math.max(0, mouthOpen * 0.1));
      ctx.quadraticCurveTo(-8, mouthY - 5 - Math.max(0, mouthOpen * 0.15), -1, mouthY - 6);
      ctx.lineTo(0, mouthY - 4);
      ctx.lineTo(1, mouthY - 6);
      ctx.quadraticCurveTo(8, mouthY - 5 - Math.max(0, mouthOpen * 0.15), 16, mouthY - Math.max(0, mouthOpen * 0.1));
      ctx.quadraticCurveTo(0, mouthY + (mouthOpen > 1 ? -mouthOpen * 0.2 : 1), -16, mouthY - Math.max(0, mouthOpen * 0.1));
      ctx.closePath();
      ctx.fill();

      // Lower lip
      ctx.fillStyle = '#d49a8c';
      ctx.beginPath();
      ctx.moveTo(-14, mouthY + Math.max(1, mouthOpen * 0.3));
      ctx.quadraticCurveTo(0, mouthY + 8 + mouthOpen * 0.4, 14, mouthY + Math.max(1, mouthOpen * 0.3));
      ctx.quadraticCurveTo(0, mouthY + (mouthOpen > 1 ? mouthOpen * 0.6 : 2), -14, mouthY + Math.max(1, mouthOpen * 0.3));
      ctx.closePath();
      ctx.fill();

      // Lip highlight
      ctx.fillStyle = 'rgba(255, 220, 210, 0.15)';
      ellipse(0, mouthY + 4 + mouthOpen * 0.2, 8, 3);
      ctx.fill();

      // Lip line when closed
      if (mouthOpen <= 1) {
        ctx.strokeStyle = '#b87a6a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-16 + smileCorner, mouthY + smileCorner * 0.3);
        ctx.quadraticCurveTo(-5, mouthY - 0.5, 0, mouthY);
        ctx.quadraticCurveTo(5, mouthY - 0.5, 16 - smileCorner, mouthY + smileCorner * 0.3);
        ctx.stroke();
      }

      // ====== CHEEKS ======
      ctx.fillStyle = 'rgba(235, 160, 140, 0.1)';
      ellipse(-38, 10, 16, 10);
      ctx.fill();
      ellipse(38, 10, 16, 10);
      ctx.fill();

      // ====== PHILTRUM ======
      ctx.strokeStyle = 'rgba(190, 140, 115, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, 18);
      ctx.lineTo(-2, mouthY - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 18);
      ctx.lineTo(2, mouthY - 5);
      ctx.stroke();

      ctx.restore(); // head nod
      ctx.restore(); // body translate

      // ====== NAME TAG ======
      // (handled by parent component)

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [isSpeaking, volume, isThinking]);

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={clsx(
          'relative transition-all duration-300',
          isSpeaking && 'speaking-ripple',
        )}
        style={{ borderRadius: '50%' }}
      >
        <canvas
          ref={canvasRef}
          className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {isThinking && (
        <div className="absolute -bottom-2 flex items-center gap-2 glass px-4 py-2 rounded-full">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-tutr-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-tutr-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-tutr-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-tutr-accent-light">Thinking...</span>
        </div>
      )}

      {isSpeaking && (
        <div className="absolute -bottom-2 flex items-center gap-2 glass px-4 py-2 rounded-full">
          <div className="flex items-end gap-0.5 h-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="audio-bar"
                style={{
                  height: `${Math.max(20, volume * 100 + Math.random() * 30)}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-tutr-accent-light">Speaking</span>
        </div>
      )}
    </div>
  );
}
