fetch("/carve-outs.json")
  .then((response) => response.json())
  .then((data) => {
    const listContainer = document.getElementById("json-list-container");
    if (listContainer) {
      let listHtml = data
        .reverse()
        .map(
          (item) => `
          <div class="card">
            <div class="card-content">
              <h4><a href="${item.url}" target="_blank">${item.title}</a></h4>
              <p class="carveouts-label">Carve Outs</p>
              <ul>
                ${item.carveOuts
                  .map((carveOut) => {
                    const linkText = carveOut.carver
                      ? `${carveOut.name} (by ${carveOut.carver})`
                      : carveOut.name;
                    return `<li><a href="${carveOut.link}" target="_blank">${linkText}</a></li>`;
                  })
                  .join("")}
              </ul>
            </div>
            <p class="episode-meta">
              ${
                item.url
                  ? `<a href="${item.url}" target="_blank">${item.episode}</a>`
                  : `<span>${item.episode}</span>`
              } &middot; ${item.date}
            </p>
          </div>
          `,
        )
        .join("");

      listContainer.innerHTML = listHtml;
    }
  });
