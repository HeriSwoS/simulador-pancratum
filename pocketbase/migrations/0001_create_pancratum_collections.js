migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('card_back')) {
      users.fields.add(
        new FileField({
          name: 'card_back',
          maxSelect: 1,
          maxSize: 8388608,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['240x336'],
        }),
      )
      app.save(users)
    }

    const cards = new Collection({
      name: 'cards',
      type: 'base',
      listRule: "@request.auth.id != '' && (owner = @request.auth.id || is_public = true)",
      viewRule: "@request.auth.id != '' && (owner = @request.auth.id || is_public = true)",
      createRule:
        "@request.auth.id != '' && @request.body.owner = @request.auth.id && @request.body.is_public = false",
      updateRule: "@request.auth.id != '' && owner = @request.auth.id",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 160 },
        {
          name: 'card_type',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['guerreiro', 'arma', 'armadura', 'evento', 'reliquia'],
        },
        {
          name: 'rarity',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['comum', 'incomum', 'rara', 'epica', 'lendaria'],
        },
        { name: 'attack', type: 'number', onlyInt: true, min: 0 },
        { name: 'defense', type: 'number', onlyInt: true, min: 0 },
        { name: 'description', type: 'text', max: 1200 },
        {
          name: 'image',
          type: 'file',
          maxSelect: 1,
          maxSize: 12582912,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          thumbs: ['160x224', '320x448', '640x896'],
        },
        { name: 'is_public', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cards_owner ON cards (owner)',
        'CREATE INDEX idx_cards_type ON cards (card_type)',
        'CREATE INDEX idx_cards_rarity ON cards (rarity)',
      ],
    })
    app.save(cards)

    const decks = new Collection({
      name: 'decks',
      type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule: "@request.auth.id != '' && owner = @request.auth.id",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, min: 1, max: 100 },
        { name: 'items', type: 'json', required: true, maxSize: 1048576 },
        {
          name: 'main_character',
          type: 'relation',
          collectionId: cards.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_decks_owner ON decks (owner)'],
    })
    app.save(decks)

    const matches = new Collection({
      name: 'matches',
      type: 'base',
      listRule: "@request.auth.id != '' && (owner = @request.auth.id || guest = @request.auth.id)",
      viewRule: "@request.auth.id != '' && (owner = @request.auth.id || guest = @request.auth.id)",
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (owner = @request.auth.id || guest = @request.auth.id)",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'guest',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 120 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['local', 'aguardando', 'em_andamento', 'finalizada'],
        },
        { name: 'practice', type: 'bool' },
        {
          name: 'deck',
          type: 'relation',
          collectionId: decks.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'state', type: 'json', required: true, maxSize: 4194304 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_matches_owner ON matches (owner)',
        'CREATE INDEX idx_matches_guest ON matches (guest)',
        'CREATE INDEX idx_matches_status ON matches (status)',
      ],
    })
    app.save(matches)
  },
  (app) => {
    for (const name of ['matches', 'decks', 'cards']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const cardBack = users.fields.getByName('card_back')
    if (cardBack) {
      users.fields.removeById(cardBack.id)
      app.save(users)
    }
  },
)
