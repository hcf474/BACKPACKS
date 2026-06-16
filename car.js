// =================================================================
// 1. MODO OSCURO INMEDIATO (Fuera de eventos para evitar retrasos)
// =================================================================
const botonModo = document.getElementById('boton-modo');

if (localStorage.getItem('tema-guardado') === 'oscuro') {
    document.body.classList.add('modo-oscuro');
    if (botonModo) botonModo.textContent = '☀️ Modo Claro';
}

if (botonModo) {
    botonModo.onclick = function() {
        document.body.classList.toggle('modo-oscuro');
        if (document.body.classList.contains('modo-oscuro')) {
            botonModo.textContent = '☀️ Modo Claro';
            localStorage.setItem('tema-guardado', 'oscuro'); 
        } else {
            botonModo.textContent = '🌙 Modo Oscuro';
            localStorage.setItem('tema-guardado', 'claro'); 
        }
    };
}

// =================================================================
// 2. CONFIGURACIÓN DE TU PROYECTO FIREBASE
// =================================================================
const firebaseConfig = {
    apiKey: "AIzaSyD7mfb7qmKhUTskFaOu4Fxc4KFSnccsNuA",
    authDomain: "backpack-4eec7.firebaseapp.com",
    projectId: "backpack-4eec7",
    storageBucket: "backpack-4eec7.firebasestorage.app",
    messagingSenderId: "690480159566",
    appId: "1:690480159566:web:90a46f81eb7548c03f1c1f"
};

// Inicializar Firebase de manera segura comprobando si ya existe
let db;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
} else {
    console.error("Firebase no está cargado. Revisa los scripts en tu HTML.");
}

// =================================================================
// 3. GESTIÓN DEL CARRITO (LocalStorage)
// =================================================================
const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

// =================================================================
// 4. COMPORTAMIENTOS AL CARGAR LA PÁGINA
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Si la página contiene el contenedor de elementos, dibuja el carrito
    if (document.getElementById('cart-items')) {
        renderCart();
    }

    // Evento para el botón de Añadir al Carrito
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const productNameElement = document.getElementById('product-name');
            const quantityElement = document.getElementById('quantity');
            const priceElement = document.querySelector('.price-detail');
            const imgElement = document.getElementById('main-img');

            if (!productNameElement) return;

            const productName = productNameElement.innerText.trim();
            const quantityRequested = parseInt(quantityElement ? quantityElement.value : 1) || 1;

            if (!db) {
                alert("Error: La base de datos no se inicializó correctamente.");
                return;
            }

            // Buscar producto en Firestore por su campo Nombre_Producto
            db.collection("productos").where("Nombre_Producto", "==", productName).get().then((querySnapshot) => {
                if (querySnapshot.empty) {
                    alert(`El producto "${productName}" no coincide exactamente con el Nombre_Producto en Firebase.`);
                    return;
                }

                const docRef = querySnapshot.docs[0].ref;
                const productData = querySnapshot.docs[0].data();
                const currentStock = productData.Stock; 
                const stockMinimo = productData.Stock_Minimo || 2; 

                // Validar existencias
                if (currentStock <= 0) {
                    alert(`Lo sentimos, "${productName}" se encuentra agotado.`);
                    return;
                }

                if (quantityRequested > currentStock) {
                    alert(`Acción rechazada. Solo quedan ${currentStock} piezas.`);
                    return;
                }

                // Descontar de Firebase
                const nuevoStock = currentStock - quantityRequested;
                docRef.update({
                    Stock: nuevoStock
                }).then(() => {
                    // Guardar localmente en el carrito
                    const product = {
                        name: productName,
                        price: priceElement ? priceElement.innerText : "$0.00",
                        quantity: quantityRequested,
                        img: imgElement ? imgElement.getAttribute('src') : ""
                    };

                    let cart = getCart();
                    const existingIndex = cart.findIndex(item => item.name === product.name);

                    if (existingIndex > -1) {
                        cart[existingIndex].quantity += product.quantity;
                    } else {
                        cart.push(product);
                    }

                    saveCart(cart);
                    
                    // Alerta basada en tus parámetros de Stock y Stock_Minimo
                    if (nuevoStock <= stockMinimo && nuevoStock > 0) {
                        alert(`¡${product.name} añadido! ⚠️ ¡Apúrate, quedan ÚLTIMAS PIEZAS! (Solo quedan ${nuevoStock} disponibles).`);
                    } else if (nuevoStock === 0) {
                        alert(`¡${product.name} añadido! Con tu compra has agotado las unidades disponibles.`);
                    } else {
                        alert(`¡${product.name} añadido correctamente!`);
                    }
                });

            }).catch((error) => {
                console.error("Error en Firestore:", error);
                alert("Error de conexión al verificar el stock.");
            });
        });
    }
});

// =================================================================
// 5. MOSTRAR PRODUCTOS EN EL CARRITO
// =================================================================
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalDisplay = document.getElementById('cart-total');
    if (!container || !totalDisplay) return;

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
                <button onclick="removeItemData('${item.name}', ${item.quantity}, ${index})" class="btn-remove">Eliminar</button>
            </div>
        `;
    });

    totalDisplay.innerText = `$${total.toFixed(2)} MXN`;
}

// =================================================================
// 6. ELIMINAR DEL CARRITO Y DEVOLVER EL STOCK A LA NUBE
// =================================================================
window.removeItemData = (productName, quantity, index) => {
    if (!db) return;
    db.collection("productos").where("Nombre_Producto", "==", productName).get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            const currentStock = querySnapshot.docs[0].data().Stock;
            return docRef.update({ Stock: currentStock + quantity });
        }
    }).then(() => {
        let cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }).catch(err => {
        console.error("Error al devolver stock:", err);
        let cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    });
};

// =================================================================
// 7. ENVIAR PEDIDO POR WHATSAPP
// =================================================================
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
