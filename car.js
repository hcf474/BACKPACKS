// =================================================================
// 1. CONFIGURACIÓN Y CONEXIÓN A FIREBASE
// =================================================================
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

// =================================================================
// 2. FUNCIONES DEL LOCALSTORAGE (Carrito)
// =================================================================
const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

// =================================================================
// 3. INICIALIZACIÓN DE COMPONENTES (DOMContentLoaded)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- MODO OSCURO GLOBAL ---
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

    // --- CARGAR CATÁLOGO DE MOCHILAS DESDE FIREBASE ---
    const contenedor = document.getElementById('contenedor-mochilas');
    if (contenedor) {
        db.collection("productos").get().then((querySnapshot) => {
            contenedor.innerHTML = ''; 

            querySnapshot.forEach((doc) => {
                const mochila = doc.data();

                let imagenMochila = "mjansportn.jpg"; 
                let paginaDetalle = "jansport_detalles.html"; 

                if (mochila.Nombre_Producto.includes("Blue")) {
                    imagenMochila = "mjsam.jpg";
                    paginaDetalle = "jansport_detalles2.html";
                } else if (mochila.Nombre_Producto.includes("Red")) {
                    imagenMochila = "mjsr.jpg";
                    paginaDetalle = "jansport_detalles3.html";
                } else if (mochila.Nombre_Producto.includes("Rose")) {
                    imagenMochila = "mjsrosa.jpg";
                    paginaDetalle = "jansport_detalles4.html";
                } else if (mochila.Nombre_Producto.includes("Unicorn")) {
                    imagenMochila = "mjsestampadou.jpg";
                    paginaDetalle = "jansport_detalles5.html";
                } else if (mochila.Nombre_Producto.includes("Broken")) {
                    imagenMochila = "mjsestampadobn.jpg";
                    paginaDetalle = "jansport_detalles6.html";
                }

                contenedor.innerHTML += `
                    <article class="product-card">
                        <img src="${mochila.Imagen_Url || imagenMochila}" alt="${mochila.Nombre_Producto}">
                        <h3>${mochila.Nombre_Producto}</h3>
                        <p>Marca: ${mochila.Nombre_Marca}</p>
                        <p style="font-size: 0.9em; opacity: 0.8;">Disponibles: ${mochila.Stock} pzas</p>
                        
                        ${mochila.Stock <= mochila.Stock_Minimo ? '<p style="color: #ff7675; font-weight: bold; font-size: 0.9em; margin: 5px 0;">⚠️ ¡Últimas piezas!</p>' : ''}
                        
                        <span class="price">$${mochila.Precio}.00 MXN</span>
                        <a href="${paginaDetalle}?id=${doc.id}" class="btn-detail">Ver Detalles</a>
                    </article>
                `;
            });
        }).catch((error) => {
            console.error("Error al traer las mochilas de Firestore: ", error);
        });
    }

    // --- CARGAR PRODUCTO INDIVIDUAL EN LA PÁGINA DE DETALLES ---
    const urlParams = new URLSearchParams(window.location.search);
    const productoId = urlParams.get('id');
    const labelNombre = document.getElementById('product-name');

    if (productoId && labelNombre) {
        db.collection("productos").doc(productoId).get().then((doc) => {
            if (doc.exists) {
                const mochila = doc.data();
                
                let imagenMochila = "mjansportn.jpg"; 
                if (mochila.Nombre_Producto.includes("Blue")) imagenMochila = "mjsam.jpg";
                if (mochila.Nombre_Producto.includes("Red")) imagenMochila = "mjsr.jpg";
                if (mochila.Nombre_Producto.includes("Rose")) imagenMochila = "mjsrosa.jpg";
                if (mochila.Nombre_Producto.includes("Unicorn")) imagenMochila = "mjsestampadou.jpg";
                if (mochila.Nombre_Producto.includes("Broken")) imagenMochila = "mjsestampadobn.jpg";

                labelNombre.innerText = mochila.Nombre_Producto;
                
                const labelPrecio = document.querySelector('.price-detail');
                if (labelPrecio) {
                    labelPrecio.innerText = `$${mochila.Precio}.00 MXN`;
                    // Guardamos el número limpio en un atributo personalizado para que el carrito lo lea sin fallas
                    labelPrecio.setAttribute('data-raw-price', mochila.Precio);
                }
                
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

    // --- ACCIÓN DE AGREGAR AL CARRITO CORREGIDA (Sin errores de texto/NaN) ---
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const inputCantidad = document.getElementById('quantity');
            const detailPrecio = document.querySelector('.price-detail');
            const mainImg = document.getElementById('main-img');

            // Obtenemos el valor numérico puro directamente desde el atributo que guardamos
            let precioNumerico = detailPrecio ? parseFloat(detailPrecio.getAttribute('data-raw-price')) : 0;
            
            // Si por alguna razón no se guardó el atributo, intentamos limpiar el texto de forma segura
            if (!precioNumerico && detailPrecio) {
                precioNumerico = parseFloat(detailPrecio.innerText.replace(/[^0-9.]/g, '')) || 0;
            }

            const product = {
                name: labelNombre ? labelNombre.innerText : 'Mochila',
                price: precioNumerico, // Guardamos el número puro para no causar errores matemáticos después
                quantity: inputCantidad ? (parseInt(inputCantidad.value) || 1) : 1,
                img: mainImg ? mainImg.getAttribute('src') : 'mjansportn.jpg'
            };

            let cart = getCart();
            const existingIndex = cart.findIndex(item => item.name === product.name);

            if (existingIndex > -1) {
                cart[existingIndex].quantity += product.quantity;
            } else {
                cart.push(product);
            }

            saveCart(cart);
            alert(`¡${product.name} añadido correctamente al carrito! 🎒`);
        });
    }

    // --- PÁGINA DEL CARRITO ---
    if (document.getElementById('cart-items')) {
        renderCart();
    }
});

// =================================================================
// 4. FUNCIONES GLOBALES (Pintar Carrito y WhatsApp)
// =================================================================
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');
    if (!container || !totalDisplay) return;

    let cart = getCart();
    let total = 0;
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-message" style="color: white; text-align: center; padding: 20px;">El carrito está vacío. ¡Explora nuestro catálogo! 🎒</p>';
        totalDisplay.innerText = '$0.00 MXN';
        return;
    }

    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        // Se usa tu estructura original para mantener intactas tus clases CSS del carrito
        container.innerHTML += `
            <div class="cart-item-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px;">
                <img src="${item.img}" alt="${item.name}" width="65" style="border-radius: 5px; border: 1px solid rgba(255,255,255,0.2);">
                <div class="cart-item-info" style="flex: 1; margin-left: 15px; text-align: left; color: white;">
                    <h4 style="margin: 0; font-size: 1.1em;">${item.name}</h4>
                    <p style="margin: 5px 0 0 0; color: #ff7675;">${item.quantity} x $${item.price}.00 MXN</p>
                </div>
                <button onclick="removeItem(${index})" class="btn-remove" style="background: #ff4757; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer;">Eliminar</button>
            </div>
        `;
    });

    totalDisplay.innerText = `$${total}.00 MXN`;
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
        message += `• ${item.quantity}x ${item.name} ($${item.price}.00 MXN)\n`;
    });
        
    const totalDisplay = document.getElementById('cart-total');
    const total = totalDisplay ? totalDisplay.innerText : '$0.00 MXN';
    message += `\n*Total a pagar: ${total}*`;

    const phone = "9531235197"; 
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
