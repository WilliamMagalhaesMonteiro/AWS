const conf_err_msg = "La confirmation et le mot de passe ne correspondent pas."
const usrname_err_msg = "Le nom d'utilisateur doit faire moins de 50 caractères."

function validateInputs() {
    const password = document.getElementById("pwd").value;
    const confirm_password = document.getElementById("pwd_conf").value;
    const username = document.getElementById("usrname").value;
    if (password != confirm_password) {
        err_msg(conf_err_msg);
        return false;
    }
    if (username.length > 50) {
        err_msg(usrname_err_msg);
        return false;
    }
    return true;
}

async function err_msg(message) {
    const element = document.querySelector(".error");
    if (element) {
        document.body.removeChild(element);
    }
    let elem = document.createElement("p");
    elem.textContent = message;
    elem.setAttribute("class", "error");
    document.body.appendChild(elem);
}  
