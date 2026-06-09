const firebaseConfig = {
    apiKey: "AIzaSyD7mfb7qmKhUTskFaOu4Fxc4KFSnccsNuA",
    authDomain: "backpack-4eec7.firebaseapp.com",
    projectId: "backpack-4eec7",
    storageBucket: "backpack-4eec7.firebasestorage.app",
    messagingSenderId: "690480159566",
    appId: "1:690480159566:web:90a46f81eb7548c03f1c1f",
    measurementId: "G-577JY6EV8B"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

document.addEventListener('DOMContentLoaded', () => {

    // --- FUNCIÓN A: CARGAR CATÁLOGO AUTOMÁTICO DESDE FIREBASE ---
    const contenedor = document.getElementById('contenedor-mochilas');
    if (contenedor) {
        db.collection("productos").get().then((querySnapshot) => {
            contenedor.innerHTML = ''; // Limpiamos las mochilas fijas de prueba

            querySnapshot.forEach((doc) => {
                const mochila = doc.data();

                let imagenMochila = "mjansportn.jpg"; 
                if (mochila.Nombre_Producto.includes("Blue")) imagenMochila = "mjsam.jpg";
                if (mochila.Nombre_Producto.includes("Red")) imagenMochila = "mjsr.jpg";
                if (mochila.Nombre_Producto.includes("Rose")) imagenMochila = "mjsrosa.jpg";
                if (mochila.Nombre_Producto.includes("Unicorn")) imagenMochila = "mjsestampadou.jpg";
                if (mochila.Nombre_Producto.includes("Broken")) imagenMochila = "mjsestampadobn.jpg";

                contenedor.innerHTML += `
                    <article class="product-card">
                        <img src="${mochila.Imagen_Url || imagenMochila}" alt="${mochila.Nombre_Producto}">
                        <h3>${mochila.Nombre_Producto}</h3>
                        <p>Marca: ${mochila.Nombre_Marca}</p>
                        <p style="font-size: 0.9em; opacity: 0.8;">Disponibles: ${mochila.Stock} pzas</p>
                        
                        ${mochila.Stock <= mochila.Stock_Minimo ? '<p style="color: #ff7675; font-weight: bold; font-size: 0.9em; margin: 5px 0;">⚠️ ¡Últimas piezas!</p>' : ''}
                        
                        <span class="price">$${mochila.Precio}.00 MXN</span>
                        <a href="jansport_detalles.html?id=${doc.id}" class="btn-detail">Ver Detalles</a>
                    </article>
                `;
            });
        }).catch((error) => {
            console.error("Error al traer las mochilas de Firestore: ", error);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get('id');

    if (productoId && document.getElementById('product-name')) {
        db.collection("productos").doc(productoId).get().then((doc) => {
            if (doc.exists) {
                const mochila = doc.data();
                
                let imagenMochila = "mjansportn.jpg"; 
                if (mochila.Nombre_Producto.includes("Blue")) imagenMochila = "mjsam.jpg";
                if (mochila.Nombre_Producto.includes("Red")) imagenMochila = "mjsr.jpg";
                if (mochila.Nombre_Producto.includes("Rose")) imagenMochila = "mjsrosa.jpg";
                if (mochila.Nombre_Producto.includes("Unicorn")) imagenMochila = "mjsestampadou.jpg";
                if (mochila.Nombre_Producto.includes("Broken")) imagenMochila = "mjsestampadobn.jpg";

                // Llenamos las etiquetas para que mantengas tu diseño de detalles
                document.getElementById('product-name').innerText = mochila.Nombre_Producto;
                document.querySelector('.price-detail').innerText = `$${mochila.Precio}.00 MXN`;
                
                const mainImg = document.getElementById('main-img');
                if (mainImg) {
                    mainImg.setAttribute('src', mochila.Imagen_Url || imagenMochila);
                    mainImg.setAttribute('alt', mochila.Nombre_Producto);
                }
            }
        }).catch((error) => {
            console.error("Error al cargar los detalles de la mochila: ", error);
        });
    }

    // --- FUNCIÓN C: ACCIÓN DEL BOTÓN AGREGAR AL CARRITO ---
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const product = {
                name: document.getElementById('product-name').innerText,
                price: document.querySelector('.price-detail').innerText,
                quantity: parseInt(document.getElementById('quantity').value) || 1,
                img: document.getElementById('main-img') ? document.getElementById('main-img').getAttribute('src') : 'mjansportn.jpg'
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

    const botonModo = document.getElementById('boton-modo');

    if (localStorage.getItem('tema-guardado') === 'oscuro') {
        document.body.classList.add('modo-oscuro');
        if (botonModo) botonModo.textContent = '☀️ Modo Claro';
    }

    if (botonModo) {
        botonModo.addEventListener('click', () => {
            document.body.classList.toggle('modo-oscuro');
            
            if (document.body.classList.contains('modo-oscuro')) {
                botonModo.textContent = '☀️ Modo Claro';
                localStorage.setItem('tema-guardado', 'oscuro'); 
            } else {
                botonModo.textContent = '🌙 Modo Oscuro';
                localStorage.setItem('tema-guardado', 'claro'); 
            }
        });
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
            <div class="cart-item-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
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
