// =================================================================
// CONFIGURACIÓN DE TU PROYECTO FIREBASE (CON TUS DATOS REALES)
// =================================================================
const firebaseConfig = {
    apiKey: "AIzaSyD7mfb7qmKhUTskFaOu4Fxc4KFSnccsNuA",
    authDomain: "backpack-4eec7.firebaseapp.com",
    projectId: "backpack-4eec7",
    storageBucket: "backpack-4eec7.firebasestorage.app",
    messagingSenderId: "690480159566",
    appId: "1:690480159566:web:90a46f81eb7548c03f1c1f"
};

// Inicializar Firebase y Cloud Firestore en modo compatibilidad
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =================================================================
// GESTIÓN DE PERSISTENCIA CON LOCALSTORAGE
// =================================================================
const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

// =================================================================
// LÓGICA DEL MODO OSCURO (Conserva tu diseño y animación estables)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
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

    // =================================================================
    // ACCIÓN: AÑADIR AL CARRITO Y DESCONTAR DEL STOCK EN CLOUD FIRESTORE
    // =================================================================
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const productName = document.getElementById('product-name').innerText;
            const quantityRequested = parseInt(document.getElementById('quantity').value) || 1;

            // Buscamos en tu colección "productos" el documento que tenga tu "Nombre_Producto"
            db.collection("productos").where("Nombre_Producto", "==", productName).get().then((querySnapshot) => {
                if (querySnapshot.empty) {
                    alert("Este producto no se encuentra registrado en el inventario de Firestore.");
                    return;
                }

                const docRef = querySnapshot.docs[0].ref;
                const productData = querySnapshot.docs[0].data();
                const currentStock = productData.Stock; // Lee tu campo "Stock" con mayúscula inicial

                // Validaciones de disponibilidad de inventario
                if (currentStock <= 0) {
                    alert(`Lo sentimos, el producto "${productName}" se encuentra agotado.`);
                    return;
                }

                if (quantityRequested > currentStock) {
                    alert(`Acción rechazada. Solo quedan ${currentStock} piezas disponibles.`);
                    return;
                }

                // Restamos las piezas compradas en la nube de forma transparente
                const nuevoStock = currentStock - quantityRequested;
                docRef.update({
                    Stock: nuevoStock
                }).then(() => {
                    // Si Firestore actualizó bien, lo agregamos al LocalStorage del carrito
                    const product = {
                        name: productName,
                        price: document.querySelector('.price-detail').innerText,
                        quantity: quantityRequested,
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
                    alert(`¡${product.name} añadido correctamente! Inventario actualizado en la nube.`);
                });

            }).catch((error) => {
                console.error("Error consultando Firestore:", error);
                alert("Hubo un error de red al verificar el stock.");
            });
        });
    }

    if (document.getElementById('cart-items')) {
        renderCart();
    }
});

// =================================================================
// RENDERIZAR ARTÍCULOS EN EL CARRITO
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
// ELIMINAR ARTÍCULO Y DEVOLVER EL ALMACÉN A LA NUBE
// =================================================================
window.removeItemData = (productName, quantity, index) => {
    db.collection("productos").where("Nombre_Producto", "==", productName).get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            const currentStock = querySnapshot.docs[0].data().Stock;
            
            // Regresamos los productos restados al campo Stock en tu Firestore
            return docRef.update({ Stock: currentStock + quantity });
        }
    }).then(() => {
        let cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }).catch(err => console.error("Error al devolver el stock:", err));
};

// =================================================================
// PROCESAR PEDIDO FINAL POR WHATSAPP
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
