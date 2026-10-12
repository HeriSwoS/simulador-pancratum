migrate(
  (app) => {
    // 0010_add_cards_card_class.js
    // Adiciona o campo 'card_class' (select: normal, lenda, mestre) à coleção cards
    const cards = app.findCollectionByNameOrId('cards')
    if (!cards.fields.getByName('card_class')) {
      cards.fields.add(
        new SelectField({
          name: 'card_class',
          required: false,
          values: ['normal', 'lenda', 'mestre'],
          maxSelect: 1,
        }),
      )
      app.save(cards)
    }

    // Preenche cartas antigas sem card_class como 'normal'
    app
      .db()
      .newQuery(
        "UPDATE cards SET card_class = 'normal' WHERE card_class IS NULL OR card_class = ''",
      )
      .execute()
  },
  (app) => {
    const cards = app.findCollectionByNameOrId('cards')
    const field = cards.fields.getByName('card_class')
    if (!field) return
    cards.fields.removeByName('card_class')
    app.save(cards)
  },
)
