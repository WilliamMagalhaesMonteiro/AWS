const conf_err_msg = "La confirmation et le mot de passe ne correspondent pas."

function validatePassword() {
    var password = document.getElementById("pwd").value;
    var confirm_password = document.getElementById("pwd_conf").value;
    if (password != confirm_password) {
        err_msg();
        return false;
    }
    return true;
}

async function err_msg() {
    const element = document.querySelector(".error");
    if (element) {
        document.body.removeChild(element);
    }
    let elem = document.createElement("p");
    elem.textContent = conf_err_msg;
    elem.setAttribute("class", "error");
    document.body.appendChild(elem);
}  
