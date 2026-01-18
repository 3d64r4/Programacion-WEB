
document = document.getElementById("formulario");
formulario.addEventListener("submit", actionformulario);

function actionformulario(event)  {
    event.preventDefault();
    alert("Mensaje enviado");
    console.log("Formulario enviado");
    formulario.reset();
}