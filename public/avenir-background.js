function initTradingBackdrop() {
  const scene = document.getElementById('scene');
  const photo = document.createElement('div');
  photo.className = 'avenir-trading-photo';
  scene.append(photo);
  let targetX = 0, targetY = 0, x = 0, y = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('pointermove', (event) => {
    targetX = event.clientX / innerWidth - .5;
    targetY = event.clientY / innerHeight - .5;
  }, { passive: true });
  addEventListener('touchmove', (event) => {
    if (!event.touches.length) return;
    targetX = event.touches[0].clientX / innerWidth - .5;
    targetY = event.touches[0].clientY / innerHeight - .5;
  }, { passive: true });
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || !ST.bg) return;
    const moving = ST.anim && !reduced;
    x += ((moving ? targetX : 0) - x) * .055;
    y += ((moving ? targetY : 0) - y) * .055;
    photo.style.transform = `translate3d(${-x * 28}px,${-y * 20}px,0) scale(1.08)`;
    scene.style.setProperty('--pointer-x', `${50 + x * 55}%`);
    scene.style.setProperty('--pointer-y', `${50 + y * 55}%`);
  }
  frame();
}
