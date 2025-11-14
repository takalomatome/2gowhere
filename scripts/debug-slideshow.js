window.addEventListener('load', ()=>{
  const slides = Array.from(document.querySelectorAll('.slide'));
  if(!slides.length){ console.log('DEBUG: no slides found'); return; }
  slides.forEach((s,i)=>{
    try{
      const rect = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      console.log(`DEBUG slide ${i}: src=${s.src||'(none)'} display=${cs.display} visibility=${cs.visibility} opacity=${cs.opacity} width=${rect.width} height=${rect.height} naturalWidth=${s.naturalWidth||'n/a'} naturalHeight=${s.naturalHeight||'n/a'}`);
      s.style.outline = '4px dashed rgba(255,0,0,0.8)';
      s.style.zIndex = 0;
      s.style.display = 'block';
    }catch(e){ console.log('DEBUG error reading slide', e); }
  });
});
