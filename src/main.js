fetch("/carve-outs.json")
  .then((response) => response.json())
  .then((data) => {
    const listContainer = document.getElementById("json-list-container");
    if (listContainer) {
      let listHtml = data
        .reverse()
        .map((item) => `
          <div class="card">
            <h4>${item.title}</h4>
            <p>Carve Outs:</p>
            <ul class="list">
                ${item.carveOuts
            .map((carveOut) => {
              const linkText = carveOut.carver
                ? `${carveOut.name} (by ${carveOut.carver})`
                : carveOut.name;
              return `<li class="list-item">
                                <a href="${carveOut.link}" target="_blank" class="link">${linkText}</a>
                            </li>`;
            })
            .join("")}
              </ul>
              <p>Episode: 
                ${item.url
            ? `<a href="${item.url}" target="_blank" class="link">${item.episode}</a>`
            : `<span>${item.episode}</span>`
          } (${item.date})
              </p>
            </div>
          `,
        )
        .join("");

      listContainer.innerHTML = listHtml;
    }
  });
