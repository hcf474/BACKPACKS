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

// Inicializar Firebase de forma segura protegiendo el entorno global
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    console.error("Error al inicializar Firebase central:", e);
}
const db = firebase.firestore();

// =================================================================
// GESTIÓN DE PERSISTENCIA CON LOCALSTORAGE
// =================================================================
const getCart = () => JSON.parse(localStorage.getItem('carrusel_cart')) || [];
const saveCart = (cart) => localStorage.setItem('carrusel_cart', JSON.stringify(cart));

// =================================================================
// LÓGICA DIRECTA DEL MODO OSCURO (Se ejecuta de inmediato)
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
// COMPORTAMIENTOS AL CARGAR EL COMPONENTES DEL DOM
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Si la página actual tiene la sección para listar productos del carrito
    if (document.getElementById('cart-items')) {
        renderCart();
    }

    // Manejo seguro de la acción de añadir productos al carrito
    const btnAdd = document.getElementById('add-to-cart');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const productNameElement = document.getElementById('product-name');
            const quantityElement = document.getElementById('quantity');
            const priceElement = document.querySelector('.price-detail');
            const imgElement = document.getElementById('main-img');

            if (!productNameElement) {
                alert("Error técnico: No se encontró el contenedor id='product-name' en este HTML.");
                return;
            }

            const productName = productNameElement.innerText.trim();
            const quantityRequested = parseInt(quantityElement ? quantityElement.value : 1) || 1;

            // Consultar el stock en tu colección "productos" evaluando tu propiedad "Nombre_Producto"
            db.collection("productos").where("Nombre_Producto", "==", productName).get().then((querySnapshot) => {
                if (querySnapshot.empty) {
                    alert(`El producto "${productName}" no está registrado con ese nombre exacto en Firestore.`);
                    return;
                }

                const docRef = querySnapshot.docs[0].ref;
                const productData = querySnapshot.docs[0].data();
                const currentStock = productData.Stock; // Respeta tu campo con la 'S' mayúscula

                // Validaciones de inventario
                if (currentStock <= 0) {
                    alert(`Lo sentimos, el producto "${productName}" se encuentra agotado.`);
                    return;
                }

                if (quantityRequested > currentStock) {
                    alert(`Acción rechazada. Solo quedan ${currentStock} piezas disponibles.`);
                    return;
                }

                // Restamos del almacén en la nube
                const nuevoStock = currentStock - quantityRequested;
                docRef.update({
                    Stock: nuevoStock
                }).then(() => {
                    // Sincronizar con el almacenamiento local (LocalStorage)
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
                    alert(`¡${product.name} añadido correctamente! Inventario actualizado.`);
                });

            }).catch((error) => {
                console.error("Error al conectar o consultar Firestore:", error);
                alert("Error de conexión con la base de datos. Verifica tu conexión a internet.");
            });
        });
    }
});

// =================================================================
// DIBUJAR FILAS DEL CARRITO
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
// DEVOLVER EL STOCK SI EL USUARIO ELIMINA UN ELEMENTO
// =================================================================
window.removeItemData = (productName, quantity, index) => {
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
        console.error("Error al devolver el stock:", err);
        // Aun si falla la red, borramos localmente para no congelar la pantalla del cliente
        let cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    });
};

// =================================================================
// ENVÍO DE PEDIDO A WHATSAPP
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
