"use strict";

function handleProxyFormSubmit(e) {
  e.preventDefault();
  console.log(this.form);
  const formData = new FormData(e.target);
  console.log(formData);
  const postBody = JSON.stringify(Object.fromEntries(formData));

  fetch(`/proxy`, {
    method: "POST",
    mode: "same-origin",
    body: JSON.stringify(Object.fromEntries(formData)),
    headers: {
      "content-type": "application/json",
    },
  }).then((response) => {
    response.text().then((data) => {
      const proxiedPage = JSON.parse(data).body;
      const proxyOutputElem = document.getElementById("proxy-output");
      proxyOutputElem.innerText = proxiedPage;
    });
  });
}

document.addEventListener("DOMContentLoaded", (e) => {
  const form = document.getElementById("proxy-form");
  form.addEventListener("submit", handleProxyFormSubmit);
});
