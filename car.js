const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

document.addEventListener('DOMContentLoaded', () => {
    
    const btnAdd = document.getElementById('add-to-cart');
if (btnAdd) {
    btnAdd.addEventListener('click', () => {
        const product = {
            name: document.getElementById('product-name').innerText,
            price: document.querySelector('.price-detail').innerText,
            quantity: parseInt(document.getElementById('quantity').value),
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
    alert(`¡${product.name} añadido correctamente!`);
});
}

if (document.getElementById('cart-items')) {
    renderCart();
}
});

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');
    let cart = getCart();
    let total = 0;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>El carrito está vacío. ¡Explora nuestro catálogo! 🎒</p>';
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