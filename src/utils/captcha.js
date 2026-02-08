export const generateCaptcha = (length = 5) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const text = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const canvas = document.createElement('canvas');
  canvas.width = 140;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { text, image: '' };

  ctx.fillStyle = '#fff7fb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 5; i += 1) {
    ctx.strokeStyle = `rgba(255, 138, 203, ${0.25 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  ctx.font = 'bold 26px Quicksand, Nunito, Arial Rounded MT Bold, sans-serif';
  ctx.fillStyle = '#3b2e4a';
  [...text].forEach((ch, i) => {
    const angle = (Math.random() - 0.5) * 0.4;
    const x = 12 + i * 24;
    const y = 32 + (Math.random() * 6 - 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  const image = canvas.toDataURL('image/png');
  return { text, image };
};
