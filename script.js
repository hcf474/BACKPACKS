document.addEventListener('DOMContentLoaded', () => {
    console.log("¡JavaScript conectado correctamente!");

    const botones = document.querySelectorAll('.btn-detail');

    botones.forEach(boton => {
        boton.addEventListener('click', function(event) {
            event.preventDefault(); 
            alert("¡Funciona! Estás viendo los detalles de: " + this.parentElement.querySelector('h3').innerText);
        });
    });
});