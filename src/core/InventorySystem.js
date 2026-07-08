export class InventorySystem {
  constructor(panelNode, listNode, onInspectItem = null) {
    this.panelNode = panelNode;
    this.listNode = listNode;
    this.onInspectItem = onInspectItem;
    this.items = [];
    this.open = false;

    this.handleListClick = this.handleListClick.bind(this);
    this.listNode.addEventListener("click", this.handleListClick);
    this.render();
  }

  toggle() {
    this.open = !this.open;
    this.syncVisibility();
  }

  close() {
    this.open = false;
    this.syncVisibility();
  }

  isOpen() {
    return this.open;
  }

  addItem(item) {
    if (this.items.some((entry) => entry.id === item.id)) {
      return;
    }

    this.items.push(item);
    this.render();
  }

  removeItem(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.render();
  }

  syncVisibility() {
    this.panelNode.classList.toggle("hidden", !this.open);
  }

  handleListClick(event) {
    const card = event.target.closest("[data-inventory-inspect]");
    if (!card) {
      return;
    }

    const item = this.items.find((entry) => entry.id === card.dataset.itemId);
    if (!item || !item.onInspect || !this.onInspectItem) {
      return;
    }

    this.onInspectItem(item);
  }

  render() {
    if (this.items.length === 0) {
      this.listNode.innerHTML = `
        <div class="inventory-empty">
          <h2>Nothing collected yet.</h2>
          <span>Future puzzle items and quest keepsakes will appear here.</span>
        </div>
      `;
      return;
    }

    this.listNode.innerHTML = this.items.map((item) => `
      <article class="inventory-card">
        <button
          type="button"
          class="inventory-item${item.onInspect ? " inventory-item--inspectable" : ""}"
          ${item.onInspect ? `data-inventory-inspect="true" data-item-id="${item.id}"` : ""}
        >
          <img class="inventory-item__image" src="${item.image}" alt="${item.name}">
          <span class="inventory-item__name">${item.name}</span>
        </button>
      </article>
    `).join("");
  }
}
