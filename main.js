fetch("/carve-outs.json")
  .then((response) => response.json())
  .then((data) => {
    const listContainer = document.getElementById("json-list-container");
    if (listContainer) {
      let listHtml = data
        .map(
          (item) => `
                <div class="card">
                    <h4>${item.title}</h4>
                    <ul class="list">
                        ${item.carveOuts
                          .map((carveOut) => {
                            const linkText = carveOut.item
                              ? `${carveOut.item} (by ${carveOut.name})`
                              : carveOut.name;
                            return `<li class="list-item">
                                <a href="${carveOut.link}" target="_blank" class="link">${linkText}</a>
                            </li>`;
                          })
                          .join("")}
                    </ul>
                </div>
            `,
        )
        .join("");

      listContainer.innerHTML = listHtml;
    }
  });
