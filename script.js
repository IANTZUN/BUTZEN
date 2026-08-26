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
