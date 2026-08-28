const modal=document.querySelector('#product-modal');
const form=document.querySelector('#product-form');
const nameEl=document.querySelector('#modal-product-name');
const priceEl=document.querySelector('#modal-product-price');
const feedback=document.querySelector('#product-feedback');
const cartModal=document.querySelector('#cart-modal');
const cartItems=document.querySelector('.cart-items');
const cartCount=document.querySelector('.cart-count');
const cart=[];

function renderCart(){
  const totalItems=cart.reduce((total,item)=>total+item.quantity,0);
  cartCount.textContent=totalItems;
  if(!cart.length){
    cartItems.innerHTML='<p class="cart-empty">TU CARRITO ESTÁ VACÍO.</p>';
    return;
  }
  cartItems.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong>
        <span>TALLA ${item.size}</span>
      </div>
      <span>${item.quantity} ×</span>
    </div>
  `).join('');
}

document.querySelectorAll('.buy-button').forEach(button=>{
  button.addEventListener('click',()=>{
    nameEl.textContent=button.dataset.product;
    priceEl.textContent=button.dataset.price;
    form.reset();
    feedback.textContent='';
    modal.showModal();
    document.body.classList.add('modal-open');
  });
});

document.querySelector('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',event=>{
  if(event.target===modal) modal.close();
});
modal.addEventListener('close',()=>document.body.classList.remove('modal-open'));

form.addEventListener('submit',event=>{
  event.preventDefault();
  const size=new FormData(form).get('size');
  const quantity=document.querySelector('#quantity').value;
  if(!size){
    feedback.textContent='SELECCIONA UNA TALLA PARA CONTINUAR.';
    return;
  }
  const existingItem=cart.find(item=>item.name===nameEl.textContent&&item.size===size);
  if(existingItem) existingItem.quantity+=Number(quantity);
  else cart.push({name:nameEl.textContent,size,quantity:Number(quantity)});
  renderCart();
  feedback.textContent=`${quantity} × ${nameEl.textContent} / TALLA ${size} AÑADIDA AL CARRITO.`;
});

document.querySelector('.cart-button').addEventListener('click',()=>cartModal.showModal());
document.querySelector('.cart-close').addEventListener('click',()=>cartModal.close());
cartModal.addEventListener('click',event=>{
  if(event.target===cartModal) cartModal.close();
});


/* ==========================================================
   NAVEGACIÓN HORIZONTAL POR PANTALLAS
========================================================== */

const horizontalTrack=document.querySelector('main');
const horizontalPages=[...horizontalTrack.querySelectorAll(':scope > section, :scope > footer')];
let horizontalLocked=false;
let activePageIndex=0;
let horizontalScrollTimer;
let horizontalLockTimer;
let wheelSettleTimer;

function pageIndexFromScroll(){
  if(!horizontalPages.length) return 0;
  return Math.max(0,Math.min(
    horizontalPages.length-1,
    Math.round(horizontalTrack.scrollLeft/horizontalTrack.clientWidth)
  ));
}

function markActivePage(index){
  activePageIndex=Math.max(0,Math.min(horizontalPages.length-1,index));

  horizontalPages.forEach((page,pageIndex)=>{
    page.classList.toggle('is-active',pageIndex===activePageIndex);
    page.classList.toggle('is-before',pageIndex<activePageIndex);
    page.classList.toggle('is-after',pageIndex>activePageIndex);
  });
}

function goToHorizontalPage(index,behavior='smooth'){
  const finalIndex=Math.max(0,Math.min(horizontalPages.length-1,index));
  const page=horizontalPages[finalIndex];

  if(!page) return;

  horizontalLocked=true;
  markActivePage(finalIndex);

  horizontalTrack.scrollTo({
    left:page.offsetLeft,
    behavior
  });

  window.clearTimeout(horizontalLockTimer);
  horizontalLockTimer=window.setTimeout(()=>{
    horizontalTrack.scrollTo({left:page.offsetLeft,behavior:'auto'});
    horizontalLocked=false;
    markActivePage(pageIndexFromScroll());
  },700);
}

function pageCanScrollVertically(page,direction){
  const tolerance=3;

  if(getComputedStyle(page).overflowY==='hidden') return false;

  if(page.scrollHeight<=page.clientHeight+tolerance) return false;

  if(direction>0){
    return page.scrollTop+page.clientHeight<page.scrollHeight-tolerance;
  }

  return page.scrollTop>tolerance;
}

horizontalTrack.addEventListener('wheel',event=>{
  if(document.body.classList.contains('modal-open')) return;
  if(event.target.closest('dialog')) return;

  const rawMovement=Math.abs(event.deltaY)>=Math.abs(event.deltaX)
    ? event.deltaY
    : event.deltaX;
  const currentIndex=pageIndexFromScroll();
  const currentPage=horizontalPages[currentIndex];
  const deltaScale=event.deltaMode===1
    ? 16
    : event.deltaMode===2
      ? currentPage.clientHeight
      : 1;
  const movement=rawMovement*deltaScale;

  if(Math.abs(movement)<2) return;

  const direction=movement>0?1:-1;

  /* En móvil o ventanas estrechas, la fila de productos se recorre primero. */
  const productRail=event.target.closest('.products');

  if(productRail&&productRail.scrollWidth>productRail.clientWidth+3){
    const canMoveProducts=direction>0
      ? productRail.scrollLeft+productRail.clientWidth<productRail.scrollWidth-3
      : productRail.scrollLeft>3;

    if(canMoveProducts){
      event.preventDefault();
      productRail.scrollLeft+=movement;
      return;
    }
  }

  /* Si una pantalla necesita desplazamiento interior, se lee primero entera. */
  if(pageCanScrollVertically(currentPage,direction)){
    return;
  }

  event.preventDefault();

  /* La rueda mueve el recorrido de forma continua, sin saltos intermedios. */
  horizontalLocked=false;
  horizontalTrack.classList.add('is-wheel-scrolling');
  horizontalTrack.scrollLeft+=movement*1.25;
  markActivePage(pageIndexFromScroll());

  window.clearTimeout(wheelSettleTimer);
  wheelSettleTimer=window.setTimeout(()=>{
    horizontalTrack.classList.remove('is-wheel-scrolling');
    goToHorizontalPage(pageIndexFromScroll());
  },220);
},{passive:false});

/* Enlaces de la barra y botones internos */

document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',event=>{
    const id=link.getAttribute('href');

    if(!id||id==='#') return;

    const target=document.querySelector(id);
    const page=target?.closest('main > section, main > footer');
    const index=horizontalPages.indexOf(page);

    if(index<0) return;

    event.preventDefault();
    goToHorizontalPage(index);
    history.replaceState(null,'',id);
  });
});

/* Flechas del teclado */

document.addEventListener('keydown',event=>{
  if(document.body.classList.contains('modal-open')) return;

  if(event.key==='ArrowRight'||event.key==='PageDown'){
    event.preventDefault();
    goToHorizontalPage(pageIndexFromScroll()+1);
  }

  if(event.key==='ArrowLeft'||event.key==='PageUp'){
    event.preventDefault();
    goToHorizontalPage(pageIndexFromScroll()-1);
  }
});

/* Actualiza la pantalla activa después de deslizar con el dedo. */

horizontalTrack.addEventListener('scroll',()=>{
  window.clearTimeout(horizontalScrollTimer);

  horizontalScrollTimer=window.setTimeout(()=>{
    markActivePage(pageIndexFromScroll());
  },140);
},{passive:true});

/* Abre directamente la sección indicada en la dirección. */

const initialTarget=location.hash?document.querySelector(location.hash):null;
const initialPage=initialTarget?.closest('main > section, main > footer');
const initialIndex=horizontalPages.indexOf(initialPage);

requestAnimationFrame(()=>{
  goToHorizontalPage(initialIndex>=0?initialIndex:0,'auto');
});


/* ==========================================================
   ESTAMPADOS INTERACTIVOS EN LAS PANTALLAS BLANCAS
========================================================== */

const patternIcons=[
  /* Sol */
  `<svg viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
      <circle cx="50" cy="50" r="18" fill="currentColor" stroke="none"/>
      <path d="M50 7v17M50 76v17M7 50h17M76 50h17M20 20l12 12M68 68l12 12M80 20L68 32M32 68L20 80"/>
    </g>
  </svg>`,

  /* Olas */
  `<svg viewBox="0 0 120 90" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round">
      <path d="M5 24c14-16 26-16 40 0s26 16 40 0 26-16 30-6"/>
      <path d="M5 47c14-16 26-16 40 0s26 16 40 0 26-16 30-6"/>
      <path d="M5 70c14-16 26-16 40 0s26 16 40 0 26-16 30-6"/>
    </g>
  </svg>`,

  /* Palmera */
  `<svg viewBox="0 0 100 130" aria-hidden="true">
    <g fill="currentColor">
      <path d="M48 34c4 25 6 55 1 91h12c3-37 0-68-6-93z"/>
      <circle cx="52" cy="30" r="7"/>
      <path d="M52 30C34 9 16 7 4 12c17 2 28 9 40 23zM52 29C63 7 81 4 96 10 78 13 68 19 58 35zM51 31C29 25 15 35 8 48c14-9 27-11 42-9zM54 31c22-7 36 2 43 14-16-7-28-8-43-6zM52 28C48 11 51 3 58 0c2 13 2 21-2 30z"/>
    </g>
  </svg>`,

  /* Tabla de surf */
  `<svg viewBox="0 0 120 55" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5">
      <path d="M5 28C23 4 94 4 115 28 92 51 25 51 5 28Z"/>
      <path d="M60 8v40M39 13c8 10 8 20 0 30"/>
    </g>
  </svg>`,

  /* Aves */
  `<svg viewBox="0 0 110 55" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round">
      <path d="M5 35C18 15 34 15 52 35 67 14 84 14 104 31"/>
    </g>
  </svg>`,

  /* Ola grande */
  `<svg viewBox="0 0 110 100" aria-hidden="true">
    <path d="M8 76c17 1 27-8 34-26 8-23 23-36 50-34-16 7-21 19-18 34 3 16 14 25 28 30-18 13-39 13-56 1-11-8-19-8-38-5Z" fill="currentColor"/>
    <path d="M13 84c22-8 38-5 52 7" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  /* Gafas de sol */
  `<svg viewBox="0 0 120 55" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round">
      <path d="M7 12h43l-4 23c-2 12-28 13-32 0zM70 12h43l-7 23c-4 13-29 12-32 0zM50 18c7-5 13-5 20 0"/>
      <path d="M20 18l20 0-5 13c-3 7-13 7-16 0zM82 18h20l-5 13c-3 7-13 7-16 0z" fill="currentColor" stroke="none"/>
    </g>
  </svg>`,

  /* Atardecer */
  `<svg viewBox="0 0 110 90" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
      <path d="M7 55h96M15 68c12-10 24-10 36 0s24 10 43-1M20 80c12-9 25-9 39 0"/>
      <path d="M30 52a25 25 0 0 1 50 0"/>
      <path d="M55 8v14M21 22l11 10M89 22 78 32"/>
    </g>
  </svg>`,

  /* Montañas */
  `<svg viewBox="0 0 120 90" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 80 40 24l18 27L77 13l38 67Z"/>
      <path d="m29 42 11-18 11 17M65 31l12-18 15 27"/>
    </g>
  </svg>`,

  /* Copo de nieve */
  `<svg viewBox="0 0 100 100" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
      <path d="M50 7v86M13 29l74 42M13 71l74-42"/>
      <path d="m39 14 11 10 11-10M39 86l11-10 11 10M18 41l15-4-4-15M82 59l-15 4 4 15M18 59l15 4-4 15M82 41l-15-4 4-15"/>
    </g>
  </svg>`,

  /* Skate */
  `<svg viewBox="0 0 130 65" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 20c8 13 22 17 42 17h31c20 0 33-4 41-17-1 18-15 28-39 28H47C23 48 9 38 8 20Z"/>
      <path d="M35 48v7M96 48v7"/>
      <circle cx="35" cy="58" r="4" fill="currentColor" stroke="none"/><circle cx="96" cy="58" r="4" fill="currentColor" stroke="none"/>
    </g>
  </svg>`,

  /* Esquís */
  `<svg viewBox="0 0 105 120" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
      <path d="M22 8c-3 42 4 77 25 106M75 8c5 42 0 78-18 106"/>
      <path d="M11 28h27M64 28h29M22 28v80M81 28v80"/>
    </g>
  </svg>`,

  /* Tienda de campaña */
  `<svg viewBox="0 0 120 85" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 76 52 12l61 64ZM52 12l10 64M35 76l27-38 27 38"/>
    </g>
  </svg>`,

  /* Pino */
  `<svg viewBox="0 0 90 125" aria-hidden="true">
    <g fill="currentColor">
      <path d="M40 90h11v31H40zM45 4 15 50h18L8 85h74L57 50h18Z"/>
    </g>
  </svg>`
];

const whitePatternPages=[
  document.querySelector('.hero'),
  document.querySelector('.collection'),
  document.querySelector('.story'),
  document.querySelector('.contact'),
  document.querySelector('main > footer')
].filter(Boolean);

function seededPatternRandom(seed){
  let value=seed>>>0;

  return ()=>{
    value=(value*1664525+1013904223)>>>0;
    return value/4294967296;
  };
}

function buildPatternField(page,pageIndex){
  page.classList.add('pattern-page');

  const field=document.createElement('div');
  field.className='pattern-field';
  field.setAttribute('aria-hidden','true');

  const random=seededPatternRandom(92821+(pageIndex*7117));
  const columns=8;
  const rows=5;
  const stampCount=columns*rows;

  for(let index=0;index<stampCount;index+=1){
    const stamp=document.createElement('div');
    const size=29+(random()*46);
    const column=index%columns;
    const row=Math.floor(index/columns);
    const x=((column+0.5)/columns)*100+((random()-0.5)*5.5);
    const y=((row+0.5)/rows)*100+((random()-0.5)*7);

    stamp.className='pattern-stamp';
    stamp.style.setProperty('--stamp-x',`${Math.min(97,Math.max(3,x)).toFixed(2)}%`);
    stamp.style.setProperty('--stamp-y',`${Math.min(95,Math.max(5,y)).toFixed(2)}%`);
    stamp.style.setProperty('--stamp-size',`${size.toFixed(1)}px`);
    stamp.style.setProperty('--stamp-rotation',`${(-18+(random()*36)).toFixed(1)}deg`);
    stamp.dataset.x=String(x);
    stamp.dataset.y=String(y);
    stamp.dataset.size=String(size);
    const iconIndex=Math.floor(random()*patternIcons.length);
    stamp.innerHTML=patternIcons[iconIndex];

    field.appendChild(stamp);
  }

  page.prepend(field);

  const stamps=[...field.children];
  let proximityFrame;

  page.addEventListener('pointermove',event=>{
    const pointerX=event.clientX;
    const pointerY=event.clientY;

    cancelAnimationFrame(proximityFrame);
    proximityFrame=requestAnimationFrame(()=>{
      const pageRect=page.getBoundingClientRect();
      const localX=pointerX-pageRect.left;
      const localY=pointerY-pageRect.top;

      stamps.forEach(stamp=>{
        const centerX=(Number(stamp.dataset.x)/100)*pageRect.width;
        const centerY=(Number(stamp.dataset.y)/100)*pageRect.height;
        const radius=Math.max(48,Number(stamp.dataset.size)*1.05);
        const distance=Math.hypot(localX-centerX,localY-centerY);

        stamp.classList.toggle('is-near',distance<radius);
      });
    });
  });

  page.addEventListener('pointerleave',()=>{
    field.querySelectorAll('.pattern-stamp.is-near').forEach(stamp=>{
      stamp.classList.remove('is-near');
    });
  });
}

whitePatternPages.forEach(buildPatternField);


/* ==========================================================
   PROFUNDIDAD 3D, PARALLAX Y TARJETAS INTERACTIVAS
========================================================== */

const motionIsReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=window.matchMedia('(pointer: fine)').matches;

function pointerPositionInside(element,event){
  const rect=element.getBoundingClientRect();

  return {
    x:(event.clientX-rect.left)/rect.width,
    y:(event.clientY-rect.top)/rect.height
  };
}

/* Portada con profundidad suave y respuesta al cursor */

const hero=document.querySelector('.hero');
const heroLockup=document.querySelector('.hero-lockup');

if(hero&&heroLockup&&!motionIsReduced&&finePointer){
  let heroFrame;

  hero.addEventListener('pointermove',event=>{
    const position=pointerPositionInside(hero,event);

    cancelAnimationFrame(heroFrame);
    heroFrame=requestAnimationFrame(()=>{
      const rotateY=(position.x-0.5)*15;
      const rotateX=(0.5-position.y)*15;

      heroLockup.style.setProperty('--hero-rotate-x',`${rotateX.toFixed(2)}deg`);
      heroLockup.style.setProperty('--hero-rotate-y',`${rotateY.toFixed(2)}deg`);
      heroLockup.style.setProperty('--hero-shift-x',`${((position.x-0.5)*12).toFixed(2)}px`);
      heroLockup.style.setProperty('--hero-shift-y',`${((position.y-0.5)*8).toFixed(2)}px`);
    });
  });

  hero.addEventListener('pointerleave',()=>{
    heroLockup.style.setProperty('--hero-rotate-x','0deg');
    heroLockup.style.setProperty('--hero-rotate-y','0deg');
    heroLockup.style.setProperty('--hero-shift-x','0px');
    heroLockup.style.setProperty('--hero-shift-y','0px');
  });
}

/* Los estampados se desplazan a distintas velocidades */

if(!motionIsReduced&&finePointer){
  whitePatternPages.forEach(page=>{
    const field=page.querySelector('.pattern-field');
    let patternFrame;

    page.addEventListener('pointermove',event=>{
      const position=pointerPositionInside(page,event);

      cancelAnimationFrame(patternFrame);
      patternFrame=requestAnimationFrame(()=>{
        const offsetX=position.x-0.5;
        const offsetY=position.y-0.5;

        field.style.setProperty('--field-shift-x',`${(-offsetX*8).toFixed(2)}px`);
        field.style.setProperty('--field-shift-y',`${(-offsetY*6).toFixed(2)}px`);
      });
    });

    page.addEventListener('pointerleave',()=>{
      field.style.setProperty('--field-shift-x','0px');
      field.style.setProperty('--field-shift-y','0px');
    });
  });
}

/* ==========================================================
   ACCESO ANTICIPADO
========================================================== */

const earlyAccessButton=document.querySelector('.account-link');
const earlyAccessModal=document.querySelector('#early-access-modal');
const earlyAccessForm=document.querySelector('#early-access-form');
const earlyAccessClose=document.querySelector('.early-access-close');
const earlyAccessFeedback=document.querySelector('#early-access-feedback');
const earlyAccessStorageKey='butzen-early-access';

earlyAccessButton.addEventListener('click',()=>{
  const savedSignup=localStorage.getItem(earlyAccessStorageKey);

  earlyAccessForm.reset();
  earlyAccessFeedback.textContent=savedSignup
    ? 'YA FORMAS PARTE DE ESTA RUTA EN ESTE DISPOSITIVO.'
    : '';
  earlyAccessModal.showModal();
  document.body.classList.add('modal-open');
});

earlyAccessClose.addEventListener('click',()=>earlyAccessModal.close());

earlyAccessModal.addEventListener('click',event=>{
  if(event.target===earlyAccessModal) earlyAccessModal.close();
});

earlyAccessModal.addEventListener('close',()=>{
  document.body.classList.remove('modal-open');
});

earlyAccessForm.addEventListener('submit',event=>{
  event.preventDefault();

  if(!earlyAccessForm.reportValidity()) return;

  const formData=new FormData(earlyAccessForm);
  const signup={
    name:String(formData.get('name')).trim(),
    email:String(formData.get('email')).trim(),
    createdAt:new Date().toISOString()
  };

  localStorage.setItem(earlyAccessStorageKey,JSON.stringify(signup));
  earlyAccessFeedback.textContent='¡ESTÁS DENTRO! NOS VEMOS ENTRE EL MAR, LA CALLE Y LA MONTAÑA.';
  earlyAccessForm.reset();
});

/* Inclinación 3D moderada en los productos */

if(!motionIsReduced&&finePointer){
  document.querySelectorAll('.product').forEach(product=>{
    const visual=product.querySelector('.product-image');

    if(!visual) return;

    product.addEventListener('pointermove',event=>{
      const position=pointerPositionInside(visual,event);
      const rotateY=(position.x-0.5)*18;
      const rotateX=(0.5-position.y)*14;

      visual.style.setProperty('--product-rotate-x',`${rotateX.toFixed(2)}deg`);
      visual.style.setProperty('--product-rotate-y',`${rotateY.toFixed(2)}deg`);
      visual.style.setProperty('--glare-x',`${(position.x*100).toFixed(1)}%`);
      visual.style.setProperty('--glare-y',`${(position.y*100).toFixed(1)}%`);
    });

    product.addEventListener('pointerleave',()=>{
      visual.style.setProperty('--product-rotate-x','0deg');
      visual.style.setProperty('--product-rotate-y','0deg');
      visual.style.setProperty('--glare-x','50%');
      visual.style.setProperty('--glare-y','50%');
    });
  });
}

/* Iluminación ambiental que sigue al cursor en cada pantalla */

horizontalPages.forEach(page=>{
  const depthLight=document.createElement('div');
  depthLight.className='depth-light';
  depthLight.setAttribute('aria-hidden','true');
  page.prepend(depthLight);

  if(motionIsReduced||!finePointer) return;

  let lightFrame;

  page.addEventListener('pointermove',event=>{
    const position=pointerPositionInside(page,event);

    cancelAnimationFrame(lightFrame);
    lightFrame=requestAnimationFrame(()=>{
      page.style.setProperty('--depth-light-x',`${(position.x*100).toFixed(1)}%`);
      page.style.setProperty('--depth-light-y',`${(position.y*100).toFixed(1)}%`);
    });
  });

  page.addEventListener('pointerleave',()=>{
    page.style.setProperty('--depth-light-x','50%');
    page.style.setProperty('--depth-light-y','45%');
  });
});
