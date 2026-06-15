// =================================================================
// 1. MODO OSCURO GLOBAL CON ANIMACIÓN INTERNA (Inmediato)
// =================================================================
const botonModo = document.getElementById('boton-modo');

// Verificar el tema guardado al cargar la página
if (localStorage.getItem('tema-guardado') === 'oscuro') {
    document.body.classList.add('modo-oscuro');
    if (botonModo) {
        botonModo.classList.add('activo');
        botonModo.textContent = '☀️ Modo Claro';
    }
}

// Escuchar el evento de clic para alternar con transición suave
if (botonModo) {
    botonModo.addEventListener('click', () => {
        document.body.classList.toggle('modo-oscuro');
        botonModo.classList.toggle('activo');
        
        if (document.body.classList.contains('modo-oscuro')) {
            botonModo.textContent = '☀️ Modo Claro';
            localStorage.setItem('tema-guardado', 'oscuro'); 
        } else {
            botonModo.textContent = '🌙 Modo Oscuro';
            localStorage.setItem('tema-guardado', 'claro'); 
        }
    });
}

// =================================================================
// 2. GESTIÓN DE PERSISTENCIA (LocalStorage)
// =================================================================
const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

// =================================================================
// 3. INTERACCIONES DEL DOM (Al cargar el documento)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Acción de Añadir al Carrito (Páginas de Detalles) ---
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const product = {
                name: document.getElementById('product-name').innerText,
                price: document.querySelector('.price-detail').innerText,
                quantity: parseInt(document.getElementById('quantity').value) || 1,
                img: document.getElementById('main-img').getAttribute('src')
            };

            let cart = getCart();
            const existingIndex = cart.findIndex(item => item.name === product.name);

            if (existingIndex > -1) {
                cart[existingIndex].quantity += product.quantity;
            } else {
                cart.push(product);
            }

            saveCart(cart);
            alert(`¡${product.name} añadido correctamente! 🎒`);
        });
    }

    // --- Cargar renderizado si estamos en la vista de carrito ---
    if (document.getElementById('cart-items')) {
        renderCart();
    }
});

// =================================================================
// 4. FUNCIONES DE VISTA DE CARRITO Y WHATSAPP
// =================================================================
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');
    if (!container || !totalDisplay) return;

    let cart = getCart();
    let total = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="color: inherit; text-align: center; padding: 20px;">El carrito está vacío. ¡Explora nuestro catálogo! 🎒</p>';
        totalDisplay.innerText = '$0.00 MXN';
        return;
    }

    cart.forEach((item, index) => {
        const priceNum = parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
        const subtotal = priceNum * item.quantity;
        total += subtotal;

        container.innerHTML += `
            <div class="cart-item-row">
                <img src="${item.img}" alt="${item.name}" width="65" style="border-radius: 5px;">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} x ${item.price}</p>
                </div>
                <button onclick="removeItem(${index})" class="btn-remove">Eliminar</button>
            </div>
        `;
    });

    totalDisplay.innerText = `$${total.toFixed(2)} MXN`;
}

window.removeItem = (index) => {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
};

window.checkoutWhatsApp = () => {
    const cart = getCart();
    if (cart.length === 0) return alert("Tu carrito no tiene productos.");

    let message = "¡Hola! Quisiera realizar el siguiente pedido en El Carrusel:\n\n";
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} (${item.price})\n`;
    });
    
    const total = document.getElementById('cart-total').innerText;
    message += `\n*Total a pagar: ${total}*`;

    const phone = "9531235197"; 
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
