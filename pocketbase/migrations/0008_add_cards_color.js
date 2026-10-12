migrate(
  (app) => {
    // 0008_add_cards_color.js
    // Adiciona o campo de cor/elemento opcional à coleção cards
    const cards = app.findCollectionByNameOrId('cards')
    if (cards.fields.getByName('color')) return // já aplicado
    cards.fields.add(
      new TextField({
        name: 'color',
        required: false,
        max: 50,
      }),
    )
    app.save(cards)
  },
  (app) => {
    const cards = app.findCollectionByNameOrId('cards')
    const field = cards.fields.getByName('color')
    if (!field) return
    cards.fields.removeByName('color')
    app.save(cards)
  },
)
