import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do Firebase
// Quando criar o seu projeto no Firebase, copie as chaves do seu Web App e cole aqui:
const firebaseConfig = {
  apiKey: "AIzaSyAdjrp1PwT1T32jYlW8MATsUHTLzCgDCWM",
  authDomain: "ramones-373c4.firebaseapp.com",
  projectId: "ramones-373c4",
  storageBucket: "ramones-373c4.firebasestorage.app",
  messagingSenderId: "551542180837",
  appId: "1:551542180837:web:06541e8d578ae676ca3d0c",
  measurementId: "G-FG26Y3W5HF"
};

// Inicializa Firebase se houver credenciais preenchidas
let db = null;
let auth = null;
let useFirebase = false;

if (firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    useFirebase = true;
    console.log("Firebase Firestore e Auth inicializados com sucesso.");
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
  }
} else {
  console.log("Firebase sem credenciais. Usando LocalStorage como backup.");
}

const getImgPath = img => {
  if (!img) return 'assets/logo.jpeg';
  return (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) ? img : 'assets/' + img;
};

// Catálogo Padrão (Fallback)
const defaultProducts = [{"name": "Skull Trace White", "cat": "camisas", "price": 119.9, "tag": "Oversized", "desc": "Oversized branca com arte caveira dark no peito.", "imgs": ["prod_13.jpg", "prod_13_costas.jpg", "prod_13_detalhe.jpg"]}, {"name": "Crow Mark Minimal", "cat": "camisas", "price": 109.9, "tag": "Oversized", "desc": "Oversized branca minimal com símbolo sombrio frontal.", "imgs": ["prod_14.jpg", "prod_14_costas.jpg", "prod_14_detalhe.jpg"]}, {"name": "Whatever Drip White", "cat": "camisas", "price": 109.9, "tag": "Oversized", "desc": "Camisa oversized branca com tipografia dripping.", "imgs": ["prod_15.jpg", "prod_15_costas.jpg", "prod_15_detalhe.jpg"]}, {"name": "Brasil Street White", "cat": "camisas", "price": 99.9, "tag": "Oversized", "desc": "Oversized Brasil streetwear com detalhe na manga.", "imgs": ["prod_16.jpg", "prod_16_costas.jpg", "prod_16_detalhe.jpg"]}, {"name": "Rolling Stones Estonada", "cat": "camisas", "price": 129.9, "tag": "Oversized", "desc": "Camisa estonada premium com visual vintage rock.", "imgs": ["prod_17.jpg", "prod_17_costas.jpg", "prod_17_detalhe.jpg"]}, {"name": "Slipknot Iowa Black", "cat": "camisas", "price": 119.9, "tag": "Oversized", "desc": "Camisa preta rock com estampa forte e caimento pesado.", "imgs": ["prod_18.jpg", "prod_18_costas.jpg", "prod_18_detalhe.jpg"]}, {"name": "Chrome Bat Black", "cat": "camisas", "price": 119.9, "tag": "Oversized", "desc": "Oversized preta com arte cromada na frente.", "imgs": ["prod_19.jpg", "prod_19_costas.jpg", "prod_19_detalhe.jpg"]}, {"name": "Calça Cargo Trevas", "cat": "calcas", "price": 149.9, "tag": "Calça", "desc": "Calça cargo preta para combinar com oversized.", "imgs": ["prod_19.jpg", "prod_19_detalhe.jpg", "prod_19_costas.jpg"]}, {"name": "Bermuda Dark Cargo", "cat": "bermudas", "price": 89.9, "tag": "Bermuda", "desc": "Bermuda streetwear com pegada urbana.", "imgs": ["prod_18.jpg", "prod_18_detalhe.jpg", "prod_18_costas.jpg"]}, {"name": "Tênis Midnight", "cat": "calcados", "price": 199.9, "tag": "Calçado", "desc": "Calçado preto para fechar o look dark.", "imgs": ["prod_17.jpg", "prod_17_detalhe.jpg", "prod_17_costas.jpg"]}, {"name": "Kep Crow Black", "cat": "caps", "price": 69.9, "tag": "Kep/Cap", "desc": "Boné cap preto com identidade do corvo.", "imgs": ["prod_19.jpg", "prod_19_detalhe.jpg", "prod_19_costas.jpg"]}];

let products = [];

// Função de sincronização com UI
function showSyncStatus(msg, isError = false) {
  const statusEl = document.getElementById('loginError');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = isError ? '#ff6471' : '#44ff7c';
  }
  const syncEl = document.getElementById('adminSyncStatus');
  if (syncEl) {
    syncEl.textContent = msg;
    syncEl.style.color = isError ? '#ff6471' : '#44ff7c';
  }
}

// Inicializar Catálogo
async function initCatalog() {
  if (useFirebase) {
    try {
      showSyncStatus("Sincronizando com o Firebase...");
      const docRef = doc(db, "loja", "catalogo");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        products = docSnap.data().products || [];
        showSyncStatus("Firebase sincronizado com sucesso!");
      } else {
        console.log("Banco de dados vazio no Firebase. Inicializando com catálogo padrão...");
        products = defaultProducts;
        await setDoc(docRef, { products: defaultProducts });
        showSyncStatus("Banco Firebase inicializado!");
      }
    } catch (error) {
      console.error("Erro Firebase, carregando dados locais:", error);
      showSyncStatus("Erro Firebase. Usando backup local.", true);
      loadLocalCatalog();
    }
  } else {
    loadLocalCatalog();
  }
  renderProducts();
}

function loadLocalCatalog() {
  products = JSON.parse(localStorage.getItem('ramones_products'));
  if (!products || !products.length) {
    products = defaultProducts;
    localStorage.setItem('ramones_products', JSON.stringify(products));
  }
}

// Salvar Catálogo (Firebase + LocalStorage)
async function saveProducts() {
  localStorage.setItem('ramones_products', JSON.stringify(products));
  if (useFirebase) {
    try {
      showSyncStatus("Salvando alterações no Firebase...");
      const docRef = doc(db, "loja", "catalogo");
      await setDoc(docRef, { products: products });
      showSyncStatus("Alterações salvas no Firebase!");
    } catch (error) {
      console.error("Erro ao salvar no Firebase:", error);
      showSyncStatus("Salvo localmente (erro no Firebase).", true);
    }
  }
}

const wa='5591988039960'; let cart=[]; let activeCat='todos'; let searchQuery='';
const format=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); const productsEl=document.getElementById('products');

// Sistema de Favoritos
let favorites = JSON.parse(localStorage.getItem('ramones_favorites')) || [];
window.toggleFavorite = (e, productName) => {
  e.stopPropagation();
  const heartBtn = e.currentTarget;
  const idx = favorites.indexOf(productName);
  if (idx > -1) {
    favorites.splice(idx, 1);
    heartBtn.style.color = '#ccc';
  } else {
    favorites.push(productName);
    heartBtn.style.color = '#e3262e';
  }
  localStorage.setItem('ramones_favorites', JSON.stringify(favorites));
};

function renderProducts(){
  productsEl.innerHTML=''; 
  const list=products.filter(p=>(activeCat==='todos'||p.cat===activeCat) && (p.name+p.desc+p.tag+p.cat).toLowerCase().includes(searchQuery.toLowerCase())); 
  if(!list.length){
    productsEl.innerHTML='<p class="empty">Nenhum produto encontrado.</p>'; 
    return;
  } 
  list.forEach((p,pi)=>{
    const card=document.createElement('article');
    card.className='product reveal show'; 
    card.dataset.index=pi; 
    
    const thumbs=p.imgs.map((im,i)=>`<button class="thumb ${i==0?'active':''}" data-img="${im}"><img src="${getImgPath(im)}" alt="${p.name}"></button>`).join('');
    
    const isFavorited = favorites.includes(p.name);
    const installPrice = format(Math.ceil((p.price / 3) * 100) / 100);
    
    card.innerHTML=`
      <div class="product-img">
        <button class="wishlist-btn" onclick="toggleFavorite(event, '${p.name}')" style="position: absolute; top: 12px; right: 12px; background: white; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 5; color: ${isFavorited ? '#e3262e' : '#ccc'}; transition: color 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <span class="badge">${p.tag}</span>
        <img class="main-photo" src="${getImgPath(p.imgs[0])}" alt="${p.name}">
        <div class="hover-info">
          <b>Detalhes da Peça</b>
          <p>${p.desc}</p>
        </div>
      </div>
      <div class="thumbs">${thumbs}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <div class="price">${format(p.price)}</div>
        <div class="price-installments">ou 3x de ${installPrice} sem juros</div>
        <div class="sizes">
          <button>P</button>
          <button class="active">M</button>
          <button>G</button>
          <button>GG</button>
        </div>
        <button class="btn-size-guide" onclick="event.stopPropagation(); openFittingRoom('${p.name}')">Tabela de Medidas e Provador</button>
        <button class="btn primary add" style="margin-top: 10px;">Adicionar ao carrinho</button>
      </div>
    `;
    
    productsEl.appendChild(card); 
    
    card.querySelectorAll('.sizes button').forEach(b=>b.onclick=()=>{
      card.querySelectorAll('.sizes button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }); 
    
    card.querySelectorAll('.thumb').forEach(t=>t.onclick=()=>{
      card.querySelectorAll('.thumb').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      card.querySelector('.main-photo').src=getImgPath(t.dataset.img);
    });
    
    // Renner Hover Image Swap
    const imgContainer = card.querySelector('.product-img');
    const mainPhoto = card.querySelector('.main-photo');
    if (p.imgs.length > 1) {
      imgContainer.addEventListener('mouseenter', () => {
        mainPhoto.src = getImgPath(p.imgs[1]);
      });
      imgContainer.addEventListener('mouseleave', () => {
        const activeThumb = card.querySelector('.thumb.active');
        const currentImg = activeThumb ? activeThumb.dataset.img : p.imgs[0];
        mainPhoto.src = getImgPath(currentImg);
      });
    }
    
    card.querySelector('.add').onclick=()=>{
      const s=card.querySelector('.sizes .active')?.textContent||'M';
      cart.push({...p,size:s});
      renderCart();
      document.getElementById('cart').classList.add('open');
    };
  });
}

function renderCart(){
  document.getElementById('cartCount').textContent=cart.length;
  const box=document.getElementById('cartItems');
  box.innerHTML=cart.length ? cart.map((i,idx)=>`
    <div class="cart-item">
      <div class="cart-item-info">
        <b>${i.name}</b>
        <div class="cart-item-meta">Tamanho: ${i.size}</div>
        <div class="cart-item-price">${format(i.price)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeItem(${idx})">Remover</button>
    </div>
  `).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 30px 0;">Seu carrinho está vazio.</p>';
  document.getElementById('cartTotal').textContent=format(cart.reduce((a,b)=>a+b.price,0));
}

window.removeItem=i=>{cart.splice(i,1);renderCart()};

document.querySelectorAll('#categoryGrid button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#categoryGrid button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  activeCat=b.dataset.cat;
  renderProducts();
  document.getElementById('drops').scrollIntoView({behavior:'smooth'});
});

// Ação de cliques nas categorias visuais
document.querySelectorAll('.visual-cat-card').forEach(card => {
  card.onclick = () => {
    const cat = card.dataset.category;
    const catButton = document.querySelector(`#categoryGrid button[data-cat="${cat}"]`);
    if (catButton) {
      catButton.click();
    }
  };
});

document.getElementById('searchBtn').onclick=()=>{
  searchQuery=document.getElementById('searchInput').value;
  renderProducts();
  document.getElementById('drops').scrollIntoView({behavior:'smooth'});
};

document.getElementById('searchInput').addEventListener('input',e=>{
  searchQuery=e.target.value;
  renderProducts();
});

// Carousel Banners Hero
function initCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  
  if (!slides.length) return;
  
  let currentSlide = 0;
  let carouselInterval = setInterval(nextSlide, 5000);
  
  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }
  
  function nextSlide() {
    goToSlide(currentSlide + 1);
  }
  
  function prevSlide() {
    goToSlide(currentSlide - 1);
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetInterval();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetInterval();
    });
  }
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      resetInterval();
    });
  });
  
  function resetInterval() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(nextSlide, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
});

document.getElementById('themeToggle').onclick=()=>document.body.classList.toggle('light-mode'); 
document.getElementById('openCart').onclick=()=>document.getElementById('cart').classList.add('open');
document.getElementById('closeCart').onclick=()=>document.getElementById('cart').classList.remove('open');

// Abrir Modal de Autenticação do Cliente
function openCustomerAuthModal(message = "") {
  document.getElementById('customerAuthError').textContent = message;
  document.getElementById('customerAuthError').style.color = '#ff6471';
  document.getElementById('customerAuthModal').style.display = 'flex';
}

document.getElementById('checkout').onclick = async () => {
  if (!cart.length) {
    alert('Seu carrinho está vazio!');
    return;
  }
  
  // Exigir login
  if (useFirebase && auth && !auth.currentUser) {
    openCustomerAuthModal("Você precisa entrar ou criar uma conta para finalizar a compra.");
    return;
  }
  
  const user = auth ? auth.currentUser : null;
  const userEmail = user ? user.email : 'offline@cliente.com';
  const userId = user ? user.uid : 'offline_id';
  const userName = (user && user.displayName) ? user.displayName : userEmail.split('@')[0];
  
  const total = cart.reduce((a, b) => a + b.price, 0);
  const items = cart.map(i => ({ name: i.name, price: i.price, size: i.size }));
  
  let orderId = "local_" + Date.now();
  
  if (useFirebase && db) {
    try {
      const docRef = await addDoc(collection(db, "pedidos"), {
        userId,
        userEmail,
        userName,
        items,
        total,
        status: 'pendente',
        metodo: 'whatsapp',
        data: new Date().toISOString()
      });
      orderId = docRef.id;
    } catch (e) {
      console.error("Erro ao registrar pedido no Firebase:", e);
    }
  }
  
  const msgItems = cart.map(i => `• ${i.name} (Tam: ${i.size}) - ${format(i.price)}`).join('%0A');
  const finalMsg = `Olá! Quero finalizar meu pedido RAMONES.%0A%0APedido ID: ${orderId}%0ACliente: ${userName} (${userEmail})%0A%0AItens:%0A${msgItems}%0A%0ATotal: ${format(total)}`;
  
  window.open(`https://wa.me/${wa}?text=${finalMsg}`, '_blank');
  
  // Limpa o carrinho
  cart = [];
  renderCart();
  document.getElementById('cart').classList.remove('open');
};

document.getElementById('checkoutMercadoPago').onclick = async () => {
  if (!cart.length) {
    alert('Seu carrinho está vazio!');
    return;
  }
  
  // Exigir login
  if (useFirebase && auth && !auth.currentUser) {
    openCustomerAuthModal("Você precisa entrar ou criar uma conta para finalizar a compra.");
    return;
  }
  
  const btn = document.getElementById('checkoutMercadoPago');
  const originalText = btn.textContent;
  btn.textContent = 'Carregando pagamento...';
  btn.disabled = true;
  
  const user = auth ? auth.currentUser : null;
  const userEmail = user ? user.email : 'offline@cliente.com';
  const userId = user ? user.uid : 'offline_id';
  const userName = (user && user.displayName) ? user.displayName : userEmail.split('@')[0];
  
  const total = cart.reduce((a, b) => a + b.price, 0);
  const items = cart.map(i => ({ name: i.name, price: i.price, size: i.size }));
  
  let orderId = "local_" + Date.now();
  
  if (useFirebase && db) {
    try {
      const docRef = await addDoc(collection(db, "pedidos"), {
        userId,
        userEmail,
        userName,
        items,
        total,
        status: 'pendente',
        metodo: 'mercado_pago',
        data: new Date().toISOString()
      });
      orderId = docRef.id;
      // Salvar id do pedido no localStorage para aprovar ao voltar
      localStorage.setItem('ramones_last_order_id', orderId);
    } catch (e) {
      console.error("Erro ao registrar pedido no Firebase:", e);
    }
  }
  
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: cart })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar o checkout');
    }
    window.location.href = data.url;
  } catch (error) {
    alert('Erro ao iniciar pagamento com Mercado Pago: ' + error.message + '\n\nPor favor, tente novamente ou finalize pelo WhatsApp.');
    console.error(error);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
};
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) e.target.classList.add('show');
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(e => io.observe(e));

// Safe Cursor Glow
window.addEventListener('mousemove', e => {
  const glow = document.querySelector('.cursor-glow');
  if (glow) {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  }
});

// Safe Page Loader (Evita corrida com caches rápidos)
function hideLoader() {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  }, 700);
}

if (document.readyState === 'complete') {
  hideLoader();
} else {
  window.addEventListener('load', hideLoader);
}

initCatalog();
renderCart();

// --- SISTEMA ADMIN ---
const ADMIN_EMAILS = [
  'ramoses.adm@ramones.com',
  'narcisofelizardo@gmail.com'
];

let isAdminAuthenticated = sessionStorage.getItem('ramones_admin_auth') === 'true';

function checkHash() {
  const hash = window.location.hash;
  if (hash === '#success') {
    const lastOrderId = localStorage.getItem('ramones_last_order_id');
    if (lastOrderId && useFirebase && db) {
      updateDoc(doc(db, "pedidos", lastOrderId), { status: "aprovado" })
        .then(() => {
          localStorage.removeItem('ramones_last_order_id');
          console.log("Pedido " + lastOrderId + " marcado como aprovado.");
        })
        .catch(e => console.error("Erro ao aprovar pedido no Firestore:", e));
    }
    alert('Pagamento aprovado com sucesso! Obrigado pela compra.');
    cart = [];
    renderCart();
    window.location.hash = '';
    return;
  }
  if (hash === '#failure') {
    alert('Houve um problema com seu pagamento. Por favor, tente novamente.');
    window.location.hash = '';
    return;
  }
  if (hash === '#pending') {
    const lastOrderId = localStorage.getItem('ramones_last_order_id');
    if (lastOrderId) {
      localStorage.removeItem('ramones_last_order_id');
    }
    alert('Seu pagamento está em análise. Enviaremos uma confirmação em breve.');
    cart = [];
    renderCart();
    window.location.hash = '';
    return;
  }

  if (hash === '#admin') {
    if (useFirebase && auth && auth.currentUser && !ADMIN_EMAILS.includes(auth.currentUser.email?.toLowerCase())) {
      alert('Acesso negado: Este e-mail não é de um administrador autorizado.');
      window.location.hash = '';
      return;
    }
    document.body.classList.add('admin-mode');
    document.getElementById('adminPanel').style.display = 'block';
    
    if (isAdminAuthenticated) {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      renderAdminProducts();
    } else {
      document.getElementById('adminLogin').style.display = 'block';
      document.getElementById('adminDashboard').style.display = 'none';
    }
  } else {
    document.body.classList.remove('admin-mode');
    document.getElementById('adminPanel').style.display = 'none';
  }
}

window.addEventListener('hashchange', checkHash);

// Monitorar Estado do Login no Firebase Auth (Admin e Cliente)
if (useFirebase && auth) {
  onAuthStateChanged(auth, (user) => {
    const userBtn = document.getElementById('userBtn');
    if (user) {
      const display = user.displayName || user.email.split('@')[0];
      userBtn.textContent = display.substring(0, 10) + (display.length > 10 ? '..' : '');
      
      if (ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
        isAdminAuthenticated = true;
        sessionStorage.setItem('ramones_admin_auth', 'true');
        showSyncStatus("Conectado como Admin: " + user.email);
      } else {
        isAdminAuthenticated = false;
        sessionStorage.removeItem('ramones_admin_auth');
        showSyncStatus("");
      }
    } else {
      isAdminAuthenticated = false;
      sessionStorage.removeItem('ramones_admin_auth');
      userBtn.textContent = 'Entrar';
    }
    checkHash();
  });
}

// Entrar com E-mail e Senha
document.getElementById('adminLoginBtn').onclick = async () => {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  
  if (!useFirebase) {
    // Fallback Offline
    if (password === '1234') {
      isAdminAuthenticated = true;
      sessionStorage.setItem('ramones_admin_auth', 'true');
      checkHash();
    } else {
      showSyncStatus("Senha incorreta (Modo Offline Fallback)!", true);
    }
    return;
  }
  
  if (!email || !password) {
    showSyncStatus("Por favor, preencha todos os campos.", true);
    return;
  }
  
  try {
    showSyncStatus("Autenticando...");
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Erro Login Email:", error);
    showSyncStatus("Erro ao fazer login: " + error.message, true);
  }
};

// Entrar com Google
document.getElementById('googleLoginBtn').onclick = async () => {
  if (!useFirebase) {
    alert("Firebase Auth não está configurado! Conecte as credenciais no script.js.");
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    showSyncStatus("Conectando ao Google...");
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Erro Google Login:", error);
    showSyncStatus("Erro de login com Google: " + error.message, true);
  }
};

document.getElementById('adminPassword').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('adminLoginBtn').click();
  }
});

document.getElementById('adminLoginCancelBtn').onclick = () => {
  window.location.hash = '';
};

document.getElementById('adminLogoutBtn').onclick = async () => {
  if (useFirebase && auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  }
  isAdminAuthenticated = false;
  sessionStorage.removeItem('ramones_admin_auth');
  checkHash();
};

function renderAdminProducts() {
  const tbody = document.getElementById('adminProductTableBody');
  tbody.innerHTML = '';
  
  products.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${getImgPath(p.imgs[0])}" class="admin-table-thumb" alt="${p.name}" /></td>
      <td><b>${p.name}</b></td>
      <td><span class="admin-cat-badge">${p.cat}</span></td>
      <td>${format(p.price)}</td>
      <td><span class="admin-tag-badge">${p.tag}</span></td>
      <td>
        <button class="btn ghost btn-sm" onclick="editProduct(${idx})">Editar</button>
        <button class="btn primary btn-sm btn-delete" onclick="deleteProduct(${idx})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editProduct = (idx) => {
  const p = products[idx];
  document.getElementById('modalTitle').textContent = 'Editar Produto';
  document.getElementById('editIndex').value = idx;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCat').value = p.cat;
  document.getElementById('prodTag').value = p.tag;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodDesc').value = p.desc;
  document.getElementById('prodImg1').value = p.imgs[0] || '';
  document.getElementById('prodImg2').value = p.imgs[1] || '';
  document.getElementById('prodImg3').value = p.imgs[2] || '';
  
  document.getElementById('adminModal').style.display = 'flex';
};

window.deleteProduct = (idx) => {
  if (confirm(`Tem certeza que deseja excluir "${products[idx].name}"?`)) {
    products.splice(idx, 1);
    saveProducts();
    renderProducts();
    renderAdminProducts();
  }
};

document.getElementById('adminAddBtn').onclick = () => {
  document.getElementById('modalTitle').textContent = 'Adicionar Produto';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('productForm').reset();
  document.getElementById('adminModal').style.display = 'flex';
};

document.getElementById('closeModalBtn').onclick = () => {
  document.getElementById('adminModal').style.display = 'none';
};

document.getElementById('productForm').onsubmit = (e) => {
  e.preventDefault();
  
  const idx = parseInt(document.getElementById('editIndex').value);
  const name = document.getElementById('prodName').value.trim();
  const cat = document.getElementById('prodCat').value;
  const tag = document.getElementById('prodTag').value.trim();
  const price = parseFloat(document.getElementById('prodPrice').value);
  const desc = document.getElementById('prodDesc').value.trim();
  
  const img1 = document.getElementById('prodImg1').value.trim();
  const img2 = document.getElementById('prodImg2').value.trim();
  const img3 = document.getElementById('prodImg3').value.trim();
  
  const imgs = [img1];
  if (img2) imgs.push(img2);
  if (img3) imgs.push(img3);
  
  const item = { name, cat, price, tag, desc, imgs };
  
  if (idx >= 0) {
    products[idx] = item;
  } else {
    products.push(item);
  }
  
  saveProducts();
  renderProducts();
  renderAdminProducts();
  document.getElementById('adminModal').style.display = 'none';
};

// Export JSON
document.getElementById('adminExportBtn').onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "produtos_ramones.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Import JSON
document.getElementById('adminImportBtn').onclick = () => {
  document.getElementById('importFileInput').click();
};

document.getElementById('importFileInput').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedProducts = JSON.parse(event.target.result);
      if (Array.isArray(importedProducts)) {
        const isValid = importedProducts.every(p => p.name && p.cat && typeof p.price === 'number' && p.tag && p.desc && Array.isArray(p.imgs));
        if (isValid) {
          if (confirm('Deseja substituir o catálogo atual pelo importado?')) {
            products = importedProducts;
            saveProducts();
            renderProducts();
            renderAdminProducts();
            alert('Catálogo importado com sucesso!');
          }
        } else {
          alert('Erro: O arquivo JSON não está no formato correto de catálogo de produtos.');
        }
      } else {
        alert('Erro: O JSON deve ser uma lista de produtos.');
      }
    } catch (err) {
      alert('Erro ao processar o JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
};

// --- AUTENTICAÇÃO E PEDIDOS DE CLIENTES ---

const userBtn = document.getElementById('userBtn');
const userDropdown = document.getElementById('userDropdown');

userBtn.onclick = (e) => {
  e.stopPropagation();
  if (auth && auth.currentUser) {
    userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
  } else {
    openCustomerAuthModal();
  }
};

window.addEventListener('click', () => {
  if (userDropdown) userDropdown.style.display = 'none';
});

// Abas de Login / Cadastro de Clientes
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('customerLoginForm');
const registerForm = document.getElementById('customerRegisterForm');

tabLogin.onclick = () => {
  tabLogin.classList.add('active');
  tabLogin.style.borderBottom = '2px solid var(--red)';
  tabLogin.style.color = 'var(--ice)';
  tabRegister.classList.remove('active');
  tabRegister.style.borderBottom = 'none';
  tabRegister.style.color = 'var(--muted)';
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
};

tabRegister.onclick = () => {
  tabRegister.classList.add('active');
  tabRegister.style.borderBottom = '2px solid var(--red)';
  tabRegister.style.color = 'var(--ice)';
  tabLogin.classList.remove('active');
  tabLogin.style.borderBottom = 'none';
  tabLogin.style.color = 'var(--muted)';
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
};

document.getElementById('closeCustomerAuthModalBtn').onclick = () => {
  document.getElementById('customerAuthModal').style.display = 'none';
};

// Enviar Login Cliente
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!useFirebase || !auth) {
    alert("Firebase Auth não está ativo!");
    return;
  }
  const email = document.getElementById('custEmail').value.trim();
  const password = document.getElementById('custPassword').value;
  const errEl = document.getElementById('customerAuthError');
  
  try {
    errEl.textContent = "Entrando...";
    errEl.style.color = '#44ff7c';
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById('customerAuthModal').style.display = 'none';
    loginForm.reset();
  } catch (err) {
    console.error(err);
    errEl.textContent = "Erro ao entrar: " + err.message;
    errEl.style.color = '#ff6471';
  }
};

// Enviar Cadastro Cliente
registerForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!useFirebase || !auth) {
    alert("Firebase Auth não está ativo!");
    return;
  }
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('customerAuthError');
  
  if (password.length < 6) {
    errEl.textContent = "A senha deve ter no mínimo 6 caracteres.";
    errEl.style.color = '#ff6471';
    return;
  }
  
  try {
    errEl.textContent = "Criando conta...";
    errEl.style.color = '#44ff7c';
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    document.getElementById('customerAuthModal').style.display = 'none';
    registerForm.reset();
    alert(`Conta criada com sucesso! Bem-vindo, ${name}.`);
  } catch (err) {
    console.error(err);
    errEl.textContent = "Erro ao criar conta: " + err.message;
    errEl.style.color = '#ff6471';
  }
};

// Login Google Cliente
document.getElementById('customerGoogleLoginBtn').onclick = async () => {
  if (!useFirebase || !auth) {
    alert("Firebase Auth não está ativo!");
    return;
  }
  const provider = new GoogleAuthProvider();
  const errEl = document.getElementById('customerAuthError');
  try {
    errEl.textContent = "Conectando ao Google...";
    errEl.style.color = '#44ff7c';
    await signInWithPopup(auth, provider);
    document.getElementById('customerAuthModal').style.display = 'none';
  } catch (err) {
    console.error(err);
    errEl.textContent = "Erro de login com Google: " + err.message;
    errEl.style.color = '#ff6471';
  }
};

// Sair Cliente
document.getElementById('customerLogoutBtn').onclick = async (e) => {
  e.preventDefault();
  if (auth) {
    await signOut(auth);
    alert("Sessão encerrada.");
  }
};

// Histórico de Compras Pessoais ("Meus Pedidos")
document.getElementById('viewOrdersBtn').onclick = (e) => {
  e.preventDefault();
  document.getElementById('customerOrdersModal').style.display = 'flex';
  loadCustomerOrders();
};

document.getElementById('closeCustomerOrdersModalBtn').onclick = () => {
  document.getElementById('customerOrdersModal').style.display = 'none';
};

async function loadCustomerOrders() {
  const listEl = document.getElementById('customerOrdersList');
  listEl.innerHTML = '<p style="text-align: center; color: var(--muted);">Buscando histórico...</p>';
  
  if (!useFirebase || !db || !auth.currentUser) {
    listEl.innerHTML = '<p style="text-align: center; color: #ff6471;">Erro: Usuário não autenticado no banco.</p>';
    return;
  }
  
  try {
    const q = query(
      collection(db, "pedidos"),
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      listEl.innerHTML = '<p style="text-align: center; color: var(--muted); margin-top: 30px;">Você ainda não possui compras registradas.</p>';
      return;
    }
    
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar no cliente por data decrescente
    orders.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    listEl.innerHTML = orders.map(o => {
      const itemsList = o.items.map(item => `• ${item.name} (${item.size}) - ${format(item.price)}`).join('<br>');
      const statusColor = o.status === 'aprovado' ? '#44ff7c' : '#ffb044';
      const statusText = o.status === 'aprovado' ? 'Aprovado' : 'Pendente';
      const dateFormatted = new Date(o.data).toLocaleString('pt-BR');
      
      return `
        <div class="order-card" style="background: #111; border: 1px solid var(--line); border-radius: 16px; padding: 18px; margin-bottom: 12px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--line); padding-bottom: 8px; margin-bottom: 8px;">
            <span style="font-size: 13px; color: var(--muted);">ID: <b>${o.id}</b></span>
            <span style="font-size: 14px; font-weight: bold; color: ${statusColor};">${statusText}</span>
          </div>
          <div style="font-size: 13px; margin-bottom: 8px; color: var(--muted);">Data: ${dateFormatted} | Canal: ${o.metodo.toUpperCase()}</div>
          <div style="font-size: 14px; line-height: 1.5; margin-bottom: 8px; color: var(--ice);">${itemsList}</div>
          <div style="font-weight: bold; font-size: 16px; text-align: right; border-top: 1px dashed var(--line); padding-top: 8px;">Total: ${format(o.total)}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    listEl.innerHTML = '<p style="text-align: center; color: #ff6471;">Erro ao carregar pedidos: ' + error.message + '</p>';
  }
}

// --- NAVEGAÇÃO E CONSULTA DE PEDIDOS RECEBIDOS (ADMIN) ---

const tabProducts = document.getElementById('adminTabProducts');
const tabOrders = document.getElementById('adminTabOrders');
const contentProducts = document.getElementById('adminContentProducts');
const contentOrders = document.getElementById('adminContentOrders');

tabProducts.onclick = () => {
  tabProducts.style.background = 'var(--wine)';
  tabProducts.style.borderColor = 'var(--red)';
  tabProducts.style.color = 'white';
  
  tabOrders.style.background = '#111';
  tabOrders.style.borderColor = 'var(--line)';
  tabOrders.style.color = 'var(--muted)';
  
  contentProducts.style.display = 'block';
  contentOrders.style.display = 'none';
};

tabOrders.onclick = () => {
  tabOrders.style.background = 'var(--wine)';
  tabOrders.style.borderColor = 'var(--red)';
  tabOrders.style.color = 'white';
  
  tabProducts.style.background = '#111';
  tabProducts.style.borderColor = 'var(--line)';
  tabProducts.style.color = 'var(--muted)';
  
  contentProducts.style.display = 'none';
  contentOrders.style.display = 'block';
  loadAdminOrders();
};

async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted);">Buscando pedidos...</td></tr>';
  
  if (!useFirebase || !db) return;
  
  try {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    if (querySnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--muted);">Nenhum pedido recebido.</td></tr>';
      return;
    }
    
    const orders = [];
    querySnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar por data decrescente
    orders.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    tbody.innerHTML = orders.map(o => {
      const itemsList = o.items.map(item => `• ${item.name} (${item.size})`).join('<br>');
      const statusColor = o.status === 'aprovado' ? '#44ff7c' : '#ffb044';
      const statusText = o.status === 'aprovado' ? 'Aprovado' : 'Pendente';
      const dateFormatted = new Date(o.data).toLocaleString('pt-BR');
      
      const approveBtn = o.status === 'pendente' 
        ? `<button class="btn primary btn-sm" onclick="approveOrder('${o.id}')" style="margin-right: 5px; background: #009ee3; border-color: #0087c4;">Aprovar</button>`
        : '';
      
      return `
        <tr>
          <td><small>${o.id}</small></td>
          <td><b>${o.userName}</b><br><span style="font-size: 12px; color: var(--muted);">${o.userEmail}</span></td>
          <td style="font-size: 13px; line-height: 1.4;">${itemsList}</td>
          <td><b>${format(o.total)}</b></td>
          <td><span class="admin-cat-badge">${o.metodo.toUpperCase()}</span></td>
          <td><small>${dateFormatted}</small></td>
          <td><span style="font-weight: bold; color: ${statusColor};">${statusText}</span></td>
          <td>
            ${approveBtn}
            <button class="btn primary btn-sm btn-delete" onclick="deleteOrder('${o.id}')">Excluir</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    console.error("Erro ao listar pedidos:", e);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ff6471;">Erro: ${e.message}</td></tr>`;
  }
}

window.approveOrder = async (orderId) => {
  if (confirm('Deseja marcar o pedido como aprovado/pago?')) {
    try {
      showSyncStatus("Atualizando pedido...");
      await updateDoc(doc(db, "pedidos", orderId), { status: "aprovado" });
      showSyncStatus("Pedido aprovado!");
      loadAdminOrders();
    } catch (err) {
      alert("Erro ao aprovar pedido: " + err.message);
    }
  }
};

window.deleteOrder = async (orderId) => {
  if (confirm('Excluir este pedido permanentemente?')) {
    try {
      showSyncStatus("Excluindo pedido...");
      await deleteDoc(doc(db, "pedidos", orderId));
      showSyncStatus("Pedido excluído!");
      loadAdminOrders();
    } catch (err) {
      alert("Erro ao excluir pedido: " + err.message);
    }
  }
};

// --- SISTEMA DO PROVADOR VIRTUAL E TABELA DE MEDIDAS ---
let currentFittingProduct = '';
let selectedGender = 'masculino';

// Medidas do modelo
const fitModelSpecs = {
  P: { chest: 94, waist: 80, hips: 96 },
  M: { chest: 102, waist: 88, hips: 104 },
  G: { chest: 110, waist: 96, hips: 112 },
  GG: { chest: 118, waist: 105, hips: 120 }
};

// Abre o Provador Virtual para um produto específico
window.openFittingRoom = (productName) => {
  currentFittingProduct = productName;
  
  // Define dinamicamente a foto do produto à esquerda do provador
  const prod = products.find(p => p.name === productName);
  const fitImg = document.getElementById('fit-product-img');
  if (prod && fitImg) {
    fitImg.src = getImgPath(prod.imgs[0]);
  }
  
  document.getElementById('fittingRoomModal').style.display = 'flex';
  showStep('step-table');
  resetFittingData();
};

// Navegação entre passos
function showStep(stepId) {
  document.querySelectorAll('.step-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}

// Resetar o estado dos formulários e do manequim
function resetFittingData() {
  document.getElementById('fit-height').value = '';
  document.getElementById('fit-weight').value = '';
  document.getElementById('fit-age').value = '';
  
  // Resetar manequim
  updateMannequin(98, 84, 100);
  
  // Resetar sliders
  document.getElementById('slide-chest').value = 98;
  document.getElementById('slide-waist').value = 84;
  document.getElementById('slide-hips').value = 100;
  
  document.getElementById('val-chest').textContent = '98 cm';
  document.getElementById('val-waist').textContent = '84 cm';
  document.getElementById('val-hips').textContent = '100 cm';
  
  // Gênero padrão
  setGender('masculino');
}

// Configura o gênero
function setGender(gender) {
  selectedGender = gender;
  if (gender === 'feminino') {
    document.getElementById('gender-f').classList.add('active');
    document.getElementById('gender-m').classList.remove('active');
  } else {
    document.getElementById('gender-m').classList.add('active');
    document.getElementById('gender-f').classList.remove('active');
  }
}

// Atualização visual das duas cópias do manequim SVG em tempo real
function updateMannequin(chest, waist, hips) {
  // Escala base: chest=98, waist=84, hips=100
  const chestScale = chest / 98;
  const waistScale = waist / 84;
  const hipsScale = hips / 100;
  
  // Atualiza todos os peitos (.v-chest-class) nos dois manequins
  document.querySelectorAll('.v-chest-class').forEach(el => el.setAttribute('rx', 32 * chestScale));
  // Atualiza todas as cinturas (.v-waist-class)
  document.querySelectorAll('.v-waist-class').forEach(el => el.setAttribute('rx', 26 * waistScale));
  // Atualiza todos os quadris (.v-hips-class)
  document.querySelectorAll('.v-hips-class').forEach(el => el.setAttribute('rx', 34 * hipsScale));
  
  // Proporções de coxas e braços
  document.querySelectorAll('.v-thigh-l-class').forEach(el => el.setAttribute('rx', 13 * hipsScale));
  document.querySelectorAll('.v-thigh-r-class').forEach(el => el.setAttribute('rx', 13 * hipsScale));
  document.querySelectorAll('.v-arm-l-class').forEach(el => el.setAttribute('rx', 8 * chestScale));
  document.querySelectorAll('.v-arm-r-class').forEach(el => el.setAttribute('rx', 8 * chestScale));
  
  // Ajuste visual nos anéis de medida
  document.querySelectorAll('.ring-chest-class').forEach(el => el.setAttribute('rx', 36 * chestScale));
  document.querySelectorAll('.ring-waist-class').forEach(el => el.setAttribute('rx', 30 * waistScale));
  document.querySelectorAll('.ring-hips-class').forEach(el => el.setAttribute('rx', 38 * hipsScale));
}

// Eventos de clique e navegação
document.getElementById('closeFittingRoomModalBtn').onclick = () => {
  document.getElementById('fittingRoomModal').style.display = 'none';
};

document.getElementById('startFittingBtn').onclick = () => {
  showStep('step-inputs');
};

document.getElementById('gender-f').onclick = () => setGender('feminino');
document.getElementById('gender-m').onclick = () => setGender('masculino');

document.getElementById('nextToSlidersBtn').onclick = () => {
  const height = parseFloat(document.getElementById('fit-height').value);
  const weight = parseFloat(document.getElementById('fit-weight').value);
  const age = parseFloat(document.getElementById('fit-age').value);
  
  if (!height || !weight || !age) {
    alert("Por favor, preencha todos os campos corporais.");
    return;
  }
  
  // Estimativa inicial de medidas baseada em estudos de proporção corporal (IMC)
  let baseChest = 98;
  let baseWaist = 84;
  let baseHips = 100;
  
  if (selectedGender === 'masculino') {
    baseChest = Math.round(weight * 1.1 + (height - 170) * 0.2);
    baseWaist = Math.round(weight * 1.05 - (height - 170) * 0.1);
    baseHips = Math.round(weight * 1.15);
  } else {
    baseChest = Math.round(weight * 1.05);
    baseWaist = Math.round(weight * 0.95);
    baseHips = Math.round(weight * 1.25);
  }
  
  baseChest = Math.max(70, Math.min(150, baseChest));
  baseWaist = Math.max(60, Math.min(140, baseWaist));
  baseHips = Math.max(75, Math.min(150, baseHips));
  
  document.getElementById('slide-chest').value = baseChest;
  document.getElementById('slide-waist').value = baseWaist;
  document.getElementById('slide-hips').value = baseHips;
  
  document.getElementById('val-chest').textContent = baseChest + ' cm';
  document.getElementById('val-waist').textContent = baseWaist + ' cm';
  document.getElementById('val-hips').textContent = baseHips + ' cm';
  
  updateMannequin(baseChest, baseWaist, baseHips);
  showStep('step-sliders');
};

document.getElementById('backToInputsBtn').onclick = () => {
  showStep('step-inputs');
};

// Eventos dos sliders e botões de +/-
const setupSlider = (sliderId, labelId, valId, decId, incId, updateFn) => {
  const slider = document.getElementById(sliderId);
  const valText = document.getElementById(valId);
  
  const updateVal = () => {
    valText.textContent = slider.value + ' cm';
    updateFn();
  };
  
  slider.addEventListener('input', updateVal);
  
  document.getElementById(decId).onclick = () => {
    slider.value = parseInt(slider.value) - 2;
    updateVal();
  };
  
  document.getElementById(incId).onclick = () => {
    slider.value = parseInt(slider.value) + 2;
    updateVal();
  };
};

const refreshMannequinFromSliders = () => {
  const c = parseInt(document.getElementById('slide-chest').value);
  const w = parseInt(document.getElementById('slide-waist').value);
  const h = parseInt(document.getElementById('slide-hips').value);
  updateMannequin(c, w, h);
};

setupSlider('slide-chest', null, 'val-chest', 'dec-chest', 'inc-chest', refreshMannequinFromSliders);
setupSlider('slide-waist', null, 'val-waist', 'dec-waist', 'inc-waist', refreshMannequinFromSliders);
setupSlider('slide-hips', null, 'val-hips', 'dec-hips', 'inc-hips', refreshMannequinFromSliders);

// Mudar tom de pele nos dois manequins
document.querySelectorAll('.skin-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.mannequin-body-group-class').forEach(group => {
      group.setAttribute('fill', btn.dataset.color);
    });
  };
});

// Calcula o caimento e o tamanho sugerido na Etapa Final
document.getElementById('nextToResultBtn').onclick = () => {
  const chest = parseInt(document.getElementById('slide-chest').value);
  const waist = parseInt(document.getElementById('slide-waist').value);
  const hips = parseInt(document.getElementById('slide-hips').value);
  
  let recommendedSize = 'P';
  if (chest > 114 || waist > 100) {
    recommendedSize = 'GG';
  } else if (chest > 106 || waist > 92) {
    recommendedSize = 'G';
  } else if (chest > 98 || waist > 84) {
    recommendedSize = 'M';
  } else {
    recommendedSize = 'P';
  }
  
  document.getElementById('recommended-size').textContent = recommendedSize;
  
  const spec = fitModelSpecs[recommendedSize];
  
  // Caimento Tórax
  const chestDiff = spec.chest - chest;
  let chestFeedback = 'ideal';
  let chestClass = 'fit-ideal';
  let ringChestColor = '#2e7d32';
  
  if (chestDiff < -2) {
    chestFeedback = 'justo';
    chestClass = 'fit-tight';
    ringChestColor = '#e3262e';
  } else if (chestDiff > 8) {
    chestFeedback = 'levemente folgado';
    chestClass = 'fit-loose';
    ringChestColor = '#2979ff';
  }
  
  const chestInd = document.getElementById('feedback-indicator-chest');
  chestInd.className = 'feedback-indicator ' + chestClass;
  document.getElementById('feedback-chest').textContent = chestFeedback;
  document.querySelectorAll('.ring-chest-class').forEach(el => el.setAttribute('stroke', ringChestColor));
  
  // Caimento Cintura
  const waistDiff = spec.waist - waist;
  let waistFeedback = 'ideal';
  let waistClass = 'fit-ideal';
  let ringWaistColor = '#2e7d32';
  
  if (waistDiff < -2) {
    waistFeedback = 'justo';
    waistClass = 'fit-tight';
    ringWaistColor = '#e3262e';
  } else if (waistDiff > 8) {
    waistFeedback = 'levemente folgado';
    waistClass = 'fit-loose';
    ringWaistColor = '#2979ff';
  }
  
  const waistInd = document.getElementById('feedback-indicator-waist');
  waistInd.className = 'feedback-indicator ' + waistClass;
  document.getElementById('feedback-waist').textContent = waistFeedback;
  document.querySelectorAll('.ring-waist-class').forEach(el => el.setAttribute('stroke', ringWaistColor));
  
  // Quadril
  const hipsDiff = spec.hips - hips;
  let ringHipsColor = '#2e7d32';
  if (hipsDiff < -2) ringHipsColor = '#e3262e';
  else if (hipsDiff > 8) ringHipsColor = '#2979ff';
  document.querySelectorAll('.ring-hips-class').forEach(el => el.setAttribute('stroke', ringHipsColor));
  
  const altContainer = document.getElementById('alt-sizes-container');
  altContainer.innerHTML = '';
  
  ['P', 'M', 'G', 'GG'].forEach(size => {
    const btn = document.createElement('button');
    btn.className = 'alt-size-btn' + (size === recommendedSize ? ' active' : '');
    btn.textContent = size;
    btn.onclick = () => {
      document.querySelectorAll('.alt-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('recommended-size').textContent = size;
      
      const newSpec = fitModelSpecs[size];
      const newChestDiff = newSpec.chest - chest;
      let newChestFeedback = 'ideal';
      let newChestClass = 'fit-ideal';
      let rC = '#2e7d32';
      
      if (newChestDiff < -2) {
        newChestFeedback = 'justo';
        newChestClass = 'fit-tight';
        rC = '#e3262e';
      } else if (newChestDiff > 8) {
        newChestFeedback = 'levemente folgado';
        newChestClass = 'fit-loose';
        rC = '#2979ff';
      }
      
      chestInd.className = 'feedback-indicator ' + newChestClass;
      document.getElementById('feedback-chest').textContent = newChestFeedback;
      document.querySelectorAll('.ring-chest-class').forEach(el => el.setAttribute('stroke', rC));
      
      const newWaistDiff = newSpec.waist - waist;
      let newWaistFeedback = 'ideal';
      let newWaistClass = 'fit-ideal';
      let rW = '#2e7d32';
      
      if (newWaistDiff < -2) {
        newWaistFeedback = 'justo';
        newWaistClass = 'fit-tight';
        rW = '#e3262e';
      } else if (newWaistDiff > 8) {
        newWaistFeedback = 'levemente folgado';
        newWaistClass = 'fit-loose';
        rW = '#2979ff';
      }
      
      waistInd.className = 'feedback-indicator ' + newWaistClass;
      document.getElementById('feedback-waist').textContent = newWaistFeedback;
      document.querySelectorAll('.ring-waist-class').forEach(el => el.setAttribute('stroke', rW));
    };
    altContainer.appendChild(btn);
  });
  
  document.querySelectorAll('.fitting-table tbody tr').forEach(tr => {
    tr.classList.remove('active-row');
    if (tr.dataset.size === recommendedSize) {
      tr.classList.add('active-row');
    }
  });
  
  showStep('step-result');
};

document.getElementById('editMedidasBtn').onclick = () => {
  showStep('step-sliders');
};

// Aplica o tamanho na página de produto
document.getElementById('closeAndApplyBtn').onclick = () => {
  const chosenSize = document.getElementById('recommended-size').textContent;
  const cards = document.querySelectorAll('.product');
  let targetCard = null;
  cards.forEach(c => {
    const title = c.querySelector('h3')?.textContent;
    if (title === currentFittingProduct) {
      targetCard = c;
    }
  });
  
  if (targetCard) {
    const sizeButtons = targetCard.querySelectorAll('.sizes button');
    sizeButtons.forEach(btn => {
      if (btn.textContent === chosenSize) {
        btn.click();
      }
    });
  }
  
  document.getElementById('fittingRoomModal').style.display = 'none';
  
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetCard.style.outline = '3px solid var(--accent)';
    targetCard.style.transition = 'outline 0.3s';
    setTimeout(() => {
      targetCard.style.outline = 'none';
    }, 1500);
  }
};

// Inicializa checagem de rota e banco
checkHash();
