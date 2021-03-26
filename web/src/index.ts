function component() {
    const element = document.createElement('div');
    element.innerHTML = "<strong>Hello, webpack!";

    return element;
}

document.body.appendChild(component());
