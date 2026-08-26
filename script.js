const modal=document.querySelector('#product-modal');
const form=document.querySelector('#product-form');
const nameEl=document.querySelector('#modal-product-name');
const priceEl=document.querySelector('#modal-product-price');
const feedback=document.querySelector('#product-feedback');

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
  feedback.textContent=`${quantity} × ${nameEl.textContent} / TALLA ${size} AÑADIDA AL CARRITO.`;
});
