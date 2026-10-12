migrate(
  (app) => {
    // 0007_add_decks_legendary_cards.js
    // Estrutura oficial PANCRATUM: 50 cartas + 1 personagem principal + 3 lendárias.
    // As lendárias são uma relação separada (máx. 3), guardadas na ordem em que
    // foram escolhidas — cada uma nasce em sua zona LENDÁRIA 1, 2 ou 3.
    const decks = app.findCollectionByNameOrId('decks')
    if (decks.fields.getByName('legendary_cards')) return // já aplicado
    const cards = app.findCollectionByNameOrId('cards')
    decks.fields.add(
      new RelationField({
        name: 'legendary_cards',
        collectionId: cards.id,
        required: false,
        minSelect: 0,
        maxSelect: 3,
      }),
    )
    app.save(decks)
  },
  (app) => {
    const decks = app.findCollectionByNameOrId('decks')
    const field = decks.fields.getByName('legendary_cards')
    if (!field) return
    decks.fields.removeByName('legendary_cards')
    app.save(decks)
  },
)
