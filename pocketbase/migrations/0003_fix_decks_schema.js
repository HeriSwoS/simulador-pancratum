migrate(
  (app) => {
    // 0003_fix_decks_schema.js
    // Ensure both items and main_character are not required in decks collection
    const decks = app.findCollectionByNameOrId('decks')
    const itemsField = decks.fields.getByName('items')
    if (itemsField) {
      itemsField.required = false
    }
    const mcField = decks.fields.getByName('main_character')
    if (mcField) {
      mcField.required = false
    }
    app.save(decks)
  },
  () => {},
)
